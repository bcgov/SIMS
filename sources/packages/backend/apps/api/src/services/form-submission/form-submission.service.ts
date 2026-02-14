import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { DataSource, IsNull, Repository } from "typeorm";
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
  FormSubmissionDecisionStatus,
} from "@sims/sims-db";
import { StudentFileService } from "../student-file/student-file.service";
import { InjectRepository } from "@nestjs/typeorm";
import {
  FormSubmissionConfig,
  FormSubmissionModel,
  KnownSupplementaryData,
} from "./form-submission.models";
import {
  ApplicationService,
  DynamicFormConfigurationService,
  FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED,
  FORM_SUBMISSION_INVALID_DYNAMIC_DATA,
  FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE,
  FORM_SUBMISSION_MIXED_FORM_CATEGORIES,
  FORM_SUBMISSION_PENDING_DECISION,
  FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION,
  FormService,
  StudentAppealService,
} from "../../services";
import { CustomNamedError, processInParallel } from "@sims/utilities";
import { ApiProcessError, DryRunSubmissionResult } from "../../types";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
} from "../../constants";
import { getSupportingUserParents } from "../../utilities";

/**
 * Service layer for Student appeals.
 */
@Injectable()
export class FormSubmissionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly studentFileService: StudentFileService,
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly formService: FormService,
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    @InjectRepository(FormSubmission)
    private readonly formSubmissionRepo: Repository<FormSubmission>,
  ) {}

  // TODO: Continue to separate this method into smaller services (or methods for now).
  async saveFormSubmission(
    studentId: number,
    applicationId: number | undefined,
    submissionItems: FormSubmissionModel[],
    auditUserId: number,
  ): Promise<FormSubmission> {
    // Validate configurations.
    const submissionConfigs =
      this.convertToFormSubmissionConfigs(submissionItems);
    // Validate the form configurations in the submission items.
    this.validatedFormConfiguration(submissionConfigs, applicationId);
    const [referenceConfig] = submissionConfigs;
    // Check if there is any existing form submission pending a decision for the same context.
    const existingFormSubmission = await this.hasPendingFormSubmission(
      studentId,
      applicationId,
      referenceConfig.formCategory,
    );
    if (existingFormSubmission) {
      throw new CustomNamedError(
        "There is already a form submission pending a decision for the same context.",
        FORM_SUBMISSION_PENDING_DECISION,
      );
    }

    let supplementaryData: KnownSupplementaryData | undefined = undefined;
    if (
      referenceConfig.formCategory === FormCategory.StudentAppeal &&
      applicationId
    ) {
      // Ensures the appeals are validated based on the eligibility criteria used for fetching the
      // eligible applications for appeal using getEligibleApplicationsForAppeal endpoint.
      const [eligibleApplication] =
        await this.studentAppealService.getEligibleApplicationsForAppeal(
          studentId,
          { applicationId },
        );
      if (!eligibleApplication) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            "The application is not eligible to submit an appeal.",
            APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
          ),
        );
      }
      // Validate if all the submitted forms are eligible appeals for the application.
      const formNames = submissionConfigs.map(
        (config) => config.formDefinitionName,
      );
      const eligibleAppealForms = new Set(
        eligibleApplication.currentAssessment.eligibleApplicationAppeals,
      );
      const ineligibleFormNames = formNames.filter(
        (formName) => !eligibleAppealForms.has(formName),
      );
      if (ineligibleFormNames.length) {
        throw new UnprocessableEntityException(
          `The submitted appeal form(s) ${ineligibleFormNames.join(", ")} is/are not eligible for the application.`,
        );
      }

      // Get the supplementary data for the form submission which are required to be populated
      // at the server side during the dry run submission.
      supplementaryData = await this.getSupplementaryDataForFormSubmission(
        studentId,
        applicationId,
      );
    }
    // Process all the dry run submissions to validate the requests.
    const validatedItems = await processInParallel(
      (submissionConfig) =>
        this.getValidatedFormSubmission(submissionConfig, supplementaryData),
      submissionConfigs,
    );

    return this.dataSource.transaction(async (entityManager) => {
      const now = new Date();
      const creator = { id: auditUserId } as User;
      const formSubmission = new FormSubmission();
      formSubmission.student = { id: studentId } as Student;
      formSubmission.application = { id: applicationId } as Application;
      formSubmission.submittedDate = now;
      formSubmission.submissionStatus = FormSubmissionStatus.Pending;
      formSubmission.formCategory = referenceConfig.formCategory;
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
        await this.studentFileService.updateStudentFiles(
          studentId,
          auditUserId,
          uniqueFileNames,
          FileOriginType.Student, // TODO: change to forms or appeal?
          { entityManager: entityManager },
        );
      }
      // TODO: send notification.
      return entityManager.getRepository(FormSubmission).save(formSubmission);
    });
  }

  private async getSupplementaryDataForFormSubmission(
    studentId: number,
    applicationId: number,
  ): Promise<KnownSupplementaryData> {
    let application: Application;
    if (applicationId) {
      // Execute application validations.
      application = await this.applicationService.getApplicationToRequestAppeal(
        applicationId,
        studentId,
      );
      if (!application) {
        throw new NotFoundException(
          "Given application either does not exist or is not complete to submit an appeal.",
        );
      }
      if (application.isArchived) {
        throw new UnprocessableEntityException(
          new ApiProcessError(
            `This application is no longer eligible to submit an appeal.`,
            APPLICATION_CHANGE_NOT_ELIGIBLE,
          ),
        );
      }
    }
    const supplementaryData: KnownSupplementaryData = {};
    if (application?.programYear) {
      supplementaryData.programYear = application.programYear.programYear;
    }
    if (application?.supportingUsers) {
      supplementaryData.parents = getSupportingUserParents(
        application.supportingUsers,
      );
    }
    return supplementaryData;
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

  convertToFormSubmissionConfigs(
    submissionItems: FormSubmissionModel[],
  ): FormSubmissionConfig[] {
    return submissionItems.map((submissionItem) => {
      const config = this.dynamicFormConfigurationService.getFormsById(
        submissionItem.dynamicConfigurationId,
      );
      if (!config) {
        throw new CustomNamedError(
          "One or more forms in the submission are not recognized.",
          FORM_SUBMISSION_UNKNOWN_FORM_CONFIGURATION,
        );
      }
      return {
        ...submissionItem,
        ...config,
      };
    });
  }

  /**
   * Validates the form configuration for the submission.
   * @param submissionItems form submission items to validate.
   * @param applicationId application ID to validate against, if applicable.
   * @throws CustomNamedError with specific error codes for different validation failures.
   */
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
          FORM_SUBMISSION_MIXED_FORM_APPLICATION_SCOPE,
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
        FORM_SUBMISSION_BUNDLED_SUBMISSION_FORMS_NOT_ALLOWED,
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
        FORM_SUBMISSION_MIXED_FORM_CATEGORIES,
      );
    }
  }

  async getValidatedFormSubmission(
    submissionItem: FormSubmissionConfig,
    supplementaryData?: KnownSupplementaryData,
  ): Promise<FormSubmissionModel> {
    // Check if the form has any inputs which are required to be populated at
    // the server side during the dry run submission.
    if (submissionItem.formData.programYear) {
      submissionItem.formData.programYear = supplementaryData?.programYear;
    }
    if (submissionItem.formData.parents) {
      submissionItem.formData.parents = supplementaryData?.parents;
    }
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
