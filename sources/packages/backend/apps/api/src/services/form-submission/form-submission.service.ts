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
  FormCategory,
  getUserFullNameLikeSearch,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import {
  FormSubmissionApplicationFilter,
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
    const [referenceSubmissionConfig] = submissionConfigs;
    // Save the form submission and the related items.
    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const creator = { id: auditUserId } as User;
      const formSubmission = new FormSubmission();
      formSubmission.student = { id: studentId } as Student;
      formSubmission.application = { id: applicationId } as Application;
      formSubmission.submittedDate = now;
      formSubmission.submissionStatus = FormSubmissionStatus.Pending;
      formSubmission.formCategory = referenceSubmissionConfig.formCategory;
      formSubmission.creator = creator;
      formSubmission.createdAt = now;
      formSubmission.formSubmissionItems = validatedItems.map(
        (submissionItem) =>
          ({
            dynamicFormConfiguration: {
              id: submissionItem.dynamicConfigurationId,
            } as DynamicFormConfiguration,
            submittedData: submissionItem.formData,
            creator: creator,
            createdAt: now,
          }) as FormSubmissionItem,
      );
      const uniqueFileNames: string[] = validatedItems.flatMap(
        (submissionItem) => submissionItem.files,
      );
      if (uniqueFileNames.length) {
        const fileOrigin =
          referenceSubmissionConfig.formCategory === FormCategory.StudentAppeal
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
   * Gets all pending student form submissions awaiting ministry review.
   * Each result represents a single {@link FormSubmission} and can include
   * multiple forms through an array of form names when a submission has more
   * than one associated form.
   * Only submissions with the specified category and status
   * {@link FormSubmissionStatus.Pending} are returned, and pagination/count
   * are based on the number of submissions, not the number of individual forms.
   * @param paginationOptions options to control pagination, sorting, and search.
   * @param formCategory category of the form submissions to filter.
   * @returns paginated list of pending form submissions, one entry per submission
   * with form names aggregated per submission.
   */
  async getPendingFormSubmissions(
    paginationOptions: FormSubmissionPendingPaginationOptions,
    formCategory: FormCategory,
  ): Promise<PaginatedResults<FormSubmissionPendingSummary>> {
    const {
      page,
      pageLimit,
      sortField,
      sortOrder,
      searchCriteria,
      applicationFilter,
    } = paginationOptions;

    const query = this.dataSource
      .getRepository(FormSubmission)
      .createQueryBuilder("formSubmission")
      .select([
        "formSubmission.id",
        "formSubmission.submittedDate",
        "student.id",
        "user.firstName",
        "user.lastName",
        "formSubmissionItem.id",
        "dynamicFormConfiguration.formDescription",
        "dynamicFormConfiguration.formType",
        "application.id",
        "application.applicationNumber",
      ])
      .innerJoin("formSubmission.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("formSubmission.formSubmissionItems", "formSubmissionItem")
      .innerJoin(
        "formSubmissionItem.dynamicFormConfiguration",
        "dynamicFormConfiguration",
      )
      .leftJoin("formSubmission.application", "application")
      .where("formSubmission.submissionStatus = :status", {
        status: FormSubmissionStatus.Pending,
      })
      .andWhere("formSubmission.formCategory = :category", {
        category: formCategory,
      });

    if (applicationFilter === FormSubmissionApplicationFilter.WithApplication) {
      query.andWhere("application.id IS NOT NULL");
    } else if (
      applicationFilter === FormSubmissionApplicationFilter.WithoutApplication
    ) {
      query.andWhere("application.id IS NULL");
    }

    if (searchCriteria) {
      const trimmedSearchCriteria = searchCriteria.trim();
      query
        .andWhere(
          new Brackets((qb) =>
            qb
              .where(getUserFullNameLikeSearch())
              .orWhere(
                "application.applicationNumber ILIKE TRIM(:searchCriteria)",
              ),
          ),
        )
        .setParameter("searchCriteria", `%${trimmedSearchCriteria}%`);
    }

    const sortFieldMapping: Record<string, string> = {
      submittedDate: "formSubmission.submittedDate",
      lastName: "user.lastName",
      applicationNumber: "application.applicationNumber",
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
        formSubmissionId: item.id,
        studentId: item.student.id,
        submittedDate: item.submittedDate,
        firstName: item.student.user.firstName,
        lastName: item.student.user.lastName,
        formNames: item.formSubmissionItems.map(
          (formSubmissionItem) =>
            formSubmissionItem.dynamicFormConfiguration.formDescription ??
            (formSubmissionItem.dynamicFormConfiguration.formType as string),
        ),
        applicationId: item.application?.id,
        applicationNumber: item.application?.applicationNumber,
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
