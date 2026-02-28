import { Injectable } from "@nestjs/common";
import { Brackets, DataSource } from "typeorm";
import {
  Application,
  User,
  FileOriginType,
  Student,
  FormSubmission,
  FormSubmissionStatus,
  FormSubmissionItem,
  DynamicFormConfiguration,
  FormSubmissionDecisionStatus,
  FormCategory,
  getUserFullNameLikeSearch,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import {
  FormSubmissionConfig,
  FormSubmissionModel,
  FormSubmissionPendingPaginationOptions,
  FormSubmissionPendingSummary,
} from "./form-submission.models";
import {
  DynamicFormConfigurationService,
  FORM_SUBMISSION_INVALID_DYNAMIC_DATA,
  FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION,
  FormService,
} from "../../services";
import {
  CustomNamedError,
  FieldSortOrder,
  processInParallel,
} from "@sims/utilities";
import { DryRunSubmissionResult } from "../../types";
import { FormSubmissionValidator } from "./form-submission-validator";
import { SupplementaryDataLoader } from "./form-supplementary-data";
import { PaginatedResults } from "../../utilities";

/**
 * Manages how the form submissions are processed, including the validations,
 * ensuring the necessary supplementary data is loaded, and how the form
 * submission and related items are saved in the database.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentFileService: StudentFileService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly formService: FormService,
    private readonly formSubmissionValidator: FormSubmissionValidator,
    private readonly supplementaryDataLoader: SupplementaryDataLoader,
  ) {}

  /**
   * Saves a form submission, including the related form submission items, executing validations
   * and ensuring the necessary supplementary data is loaded for the submission.
   * @param studentId ID of the student associated with the form submission.
   * @param applicationId ID of the application associated with the form submission, if applicable.
   * @param submissionItems form submission items to be saved as part of the form submission.
   * @param auditUserId ID of the user performing the operation, used for auditing purposes.
   * @returns the saved form submission with the related form submission items.
   */
  async saveFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    submissionItems: FormSubmissionModel[],
    auditUserId: number,
  ): Promise<FormSubmission> {
    const submissionConfigs = this.convertToFormSubmissionConfigs(
      submissionItems,
      applicationId,
    );
    // Validate the form submission based on different validators.
    await this.formSubmissionValidator.validate(submissionConfigs, studentId);
    // Ensure all form submissions have the necessary supplementary data loaded to be processed
    // in the dry run submission, such as parents and program year for application-scoped forms.
    await this.supplementaryDataLoader.loadSupplementaryData(
      submissionConfigs,
      studentId,
    );
    // Process all the dry run submissions to validate the requests.
    const validatedItems = await processInParallel(
      (submissionConfig) => this.getValidatedFormSubmission(submissionConfig),
      submissionConfigs,
    );
    const formCategory = submissionConfigs[0].formCategory;
    // Save the form submission and the related items.
    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const creator = { id: auditUserId } as User;
      const formSubmission = new FormSubmission();
      formSubmission.student = { id: studentId } as Student;
      formSubmission.application = { id: applicationId } as Application;
      formSubmission.submittedDate = now;
      formSubmission.submissionStatus = FormSubmissionStatus.Pending;
      formSubmission.formCategory = formCategory;
      formSubmission.creator = creator;
      formSubmission.createdAt = now;
      formSubmission.formSubmissionItems = validatedItems.map(
        (submissionItem) =>
          ({
            dynamicFormConfiguration: {
              id: submissionItem.dynamicConfigurationId,
            } as DynamicFormConfiguration,
            submittedData: submissionItem.formData,
            decisionStatus: FormSubmissionDecisionStatus.Pending,
            creator: creator,
            createdAt: now,
          }) as FormSubmissionItem,
      );
      const uniqueFileNames: string[] = validatedItems.flatMap(
        (submissionItem) => submissionItem.files,
      );
      if (uniqueFileNames.length) {
        const fileOrigin =
          formCategory === FormCategory.StudentAppeal
            ? FileOriginType.Appeal
            : FileOriginType.Student;
        await this.studentFileService.updateStudentFiles(
          studentId,
          auditUserId,
          uniqueFileNames,
          fileOrigin,

          { entityManager: entityManager },
        );
      }
      // TODO: send notification.
      return entityManager.getRepository(FormSubmission).save(formSubmission);
    });
  }

  /**
   * Gets all pending student form submission items awaiting ministry review,
   * returning one entry per form within a submission.
   * Only items belonging to submissions with category {@link FormCategory.StudentForm}
   * and status {@link FormSubmissionStatus.Pending} are returned.
   * @param paginationOptions options to control pagination, sorting, and search.
   * @returns paginated list of pending form submission items, one per form.
   */
  async getPendingFormSubmissions(
    paginationOptions: FormSubmissionPendingPaginationOptions,
  ): Promise<PaginatedResults<FormSubmissionPendingSummary>> {
    const { page, pageLimit, sortField, sortOrder, searchCriteria } =
      paginationOptions;

    const query = this.dataSource
      .getRepository(FormSubmissionItem)
      .createQueryBuilder("formSubmissionItem")
      .select([
        "formSubmissionItem.id",
        "formSubmission.id",
        "formSubmission.submittedDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "dynamicFormConfiguration.formDescription",
        "dynamicFormConfiguration.formType",
      ])
      .innerJoin("formSubmissionItem.formSubmission", "formSubmission")
      .innerJoin("formSubmission.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin(
        "formSubmissionItem.dynamicFormConfiguration",
        "dynamicFormConfiguration",
      )
      .where("formSubmission.submissionStatus = :status", {
        status: FormSubmissionStatus.Pending,
      })
      .andWhere("formSubmission.formCategory = :category", {
        category: FormCategory.StudentForm,
      });

    if (searchCriteria) {
      query
        .andWhere(new Brackets((qb) => qb.where(getUserFullNameLikeSearch())))
        .setParameter("searchCriteria", `%${searchCriteria}%`);
    }

    const sortFieldMapping: Record<string, string> = {
      submittedDate: "formSubmission.submittedDate",
      lastName: "user.lastName",
    };
    const dbSortField =
      sortFieldMapping[sortField ?? "submittedDate"] ??
      "formSubmission.submittedDate";

    query
      .orderBy(dbSortField, sortOrder ?? FieldSortOrder.DESC)
      .skip(page * pageLimit)
      .take(pageLimit);

    const [items, count] = await query.getManyAndCount();

    return {
      results: items.map((item) => ({
        formSubmissionId: item.formSubmission.id,
        studentId: item.formSubmission.student.id,
        submittedDate: item.formSubmission.submittedDate,
        firstName: item.formSubmission.student.user.firstName ?? undefined,
        lastName: item.formSubmission.student.user.lastName,
        formName:
          item.dynamicFormConfiguration.formDescription ??
          (item.dynamicFormConfiguration.formType as string),
      })),
      count,
    };
  }

  /**
   * Converts the form submission models to form submission configurations,
   * making the association of the form submission items with the related form
   * configurations and preparing the data for validation and saving.
   * @param submissionItems form submission models to be converted.
   * @param applicationId application ID to be associated with the form submissions.
   * Only required for forms that have application scope.
   * @returns an array of form submission configurations.
   */
  private convertToFormSubmissionConfigs(
    submissionItems: FormSubmissionModel[],
    applicationId: number | undefined = undefined,
  ): FormSubmissionConfig[] {
    return submissionItems.map((submissionItem) => {
      const config = this.dynamicFormConfigurationService.getFormById(
        submissionItem.dynamicConfigurationId,
      );
      if (!config) {
        throw new CustomNamedError(
          "One or more forms configurations in the submission are not recognized.",
          FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION,
        );
      }
      return {
        applicationId,
        ...submissionItem,
        ...config,
      };
    });
  }

  /**
   * Executes a dry run submission for the given form
   * submission configuration to validate the request.
   * @param submissionItem form submission configuration to be validated.
   * @returns validated form submission model.
   */
  private async getValidatedFormSubmission(
    submissionItem: FormSubmissionConfig,
  ): Promise<FormSubmissionModel> {
    let submissionResult: DryRunSubmissionResult;
    try {
      submissionResult = await this.formService.dryRunSubmission(
        submissionItem.formDefinitionName,
        submissionItem.formData,
      );
    } catch (error: unknown) {
      throw new Error("Dry run submission failed due to unknown reason.", {
        cause: error,
      });
    }
    if (!submissionResult.valid) {
      throw new CustomNamedError(
        "Not able to complete the submission due to an invalid request.",
        FORM_SUBMISSION_INVALID_DYNAMIC_DATA,
      );
    }
    return {
      dynamicConfigurationId: submissionItem.dynamicConfigurationId,
      formData: submissionResult.data.data,
      files: submissionItem.files,
    };
  }
}
