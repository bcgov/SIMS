import { Injectable } from "@nestjs/common";
import { DataSource, IsNull, Not, Repository } from "typeorm";
import {
  Application,
  User,
  FileOriginType,
  Student,
  FormSubmission,
  FormCategory,
  FormSubmissionStatus,
  FormSubmissionItem,
  DynamicFormConfiguration,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FormSubmissionConfig,
  FormSubmissionModel,
} from "./form-submission.models";
import { FormSubmissionDecisionStatus } from "@sims/sims-db/entities/form-submission-decision-status.type";
import { DynamicFormConfigurationService } from "../../services";
import { CustomNamedError } from "@sims/utilities";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentFileService: StudentFileService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  async saveFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    formCategory: FormCategory,
    submissionItems: FormSubmissionModel[],
    auditUserId: number,
  ): Promise<FormSubmission> {
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
      formSubmission.formSubmissionItems = submissionItems.map(
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
      const uniqueFileNames: string[] = submissionItems.flatMap(
        (submissionItem) => submissionItem.files,
      );
      if (uniqueFileNames.length) {
        await this.studentFileService.updateStudentFiles(
          studentId,
          auditUserId,
          uniqueFileNames,
          // TODO: change to appeal?
          FileOriginType.Student,
          { entityManager: entityManager },
        );
      }
      // TODO: send notification.
      return entityManager.getRepository(FormSubmission).save(formSubmission);
    });
  }

  /**
   * Checks if there is pending form submission for the submission context.
   * @param studentId student ID related to the appeal.
   * @param formCategory form category that, together with submission grouping,
   * identifies the type of form submission.
   * @param submissionGrouping submission grouping that, together with form category,
   * identifies the type of form submission.
   * @param options query options.
   * - `applicationId` application ID to filter the submission, when applicable.
   * @returns true if exists, false otherwise.
   */
  async hasPendingFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    formCategory: FormCategory,
  ): Promise<boolean> {
    return this.formSubmissionRepo.exists({
      where: {
        student: { id: studentId },
        application: applicationId ? { id: applicationId } : IsNull(),
        formCategory: formCategory,
        submissionStatus: FormSubmissionStatus.Pending,
      },
    });
  }

  async getFormSubmissionsByStudentId(
    studentId: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        formCategory: true,
        submissionStatus: true,
        submittedDate: true,
        assessedDate: true,
        formSubmissionItems: {
          id: true,
          dynamicFormConfiguration: {
            id: true,
            formType: true,
          },
          decisionStatus: true,
          decisionDate: true,
        },
        application: { id: true, applicationNumber: true },
      },
      relations: {
        formSubmissionItems: { dynamicFormConfiguration: true },
        application: true,
      },
      where: [{ student: { id: studentId } }],
      order: { submittedDate: "DESC", formSubmissionItems: { id: "ASC" } },
    });
  }

  convertToFormSubmissionConfigs(
    submissionItems: FormSubmissionModel[],
  ): FormSubmissionConfig[] {
    return submissionItems.map((submissionItem) => {
      const config = this.dynamicFormConfigurationService.getDynamicFormById(
        submissionItem.dynamicConfigurationId,
      );
      if (!config) {
        throw new CustomNamedError(
          "One or more forms in the submission are not recognized.",
          "UNKNOWN_FORM_CONFIGURATION",
        );
      }
      return {
        ...submissionItem,
        ...config,
      };
    });
  }

  validatedFormConfiguration(
    submissionItems: FormSubmissionConfig[],
    applicationId: number | undefined,
  ): void {
    const validationModels =
      this.convertToFormSubmissionConfigs(submissionItems);
    // Validate if all forms share the same scope.
    if (applicationId) {
      const hasApplicationScope = validationModels.every(
        (validationModel) => validationModel.hasApplicationScope,
      );
      if (!hasApplicationScope) {
        throw new CustomNamedError(
          "All forms in the submission must have application scope if an application ID is provided.",
          "MIXED_FORM_APPLICATION_SCOPE",
        );
      }
    }
    // Validate if the forms allow bundled submissions when there are multiple items.
    const hasAllowedItemsQuantity =
      validationModels.length === 1 ||
      (validationModels.length > 1 &&
        validationModels.every((item) => item.allowBundledSubmission));
    if (!hasAllowedItemsQuantity) {
      throw new CustomNamedError(
        "One or more forms in the submission do not allow bundled submissions.",
        "BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED",
      );
    }
    // Validate if all forms share the same category.
    const [referenceForm] = validationModels;
    const allSameCategory = validationModels.every(
      (validationModel) =>
        validationModel.formCategory === referenceForm.formCategory,
    );
    if (!allSameCategory) {
      throw new CustomNamedError(
        "All forms in the submission must share the same form category.",
        "MIXED_FORM_CATEGORIES",
      );
    }
  }

  /**
   * Get student appeals submissions that are not in pending status.
   * The non-pending submissions should be either pending for decision
   * or had all their individual items declined.
   * @param applicationId application ID to filter the submissions.
   * @returns list of non-completed student appeals submissions.
   */
  async getNonCompletedAppealsSubmissions(
    applicationId: number,
  ): Promise<FormSubmission[]> {
    return this.formSubmissionRepo.find({
      select: {
        id: true,
        submissionStatus: true,
        submittedDate: true,
      },
      where: {
        formCategory: FormCategory.StudentAppeal,
        application: { id: applicationId },
        submissionStatus: Not(FormSubmissionStatus.Pending),
      },
    });
  }
}
