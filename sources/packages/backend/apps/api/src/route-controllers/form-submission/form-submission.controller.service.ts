import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  FormSubmissionConfig,
  FormSubmissionModel,
  FormSubmissionService,
  KnownSupplementaryData,
  StudentAppealService,
} from "../../services";
import { ApiProcessError, DryRunSubmissionResult } from "../../types";
import { Application, FormCategory } from "@sims/sims-db";
import { FormSubmissionAPIInDTO } from "./models/form-submission.dto";
import {
  APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
  APPLICATION_CHANGE_NOT_ELIGIBLE,
} from "apps/api/src/constants";
import { processInParallel } from "@sims/utilities";
import { getSupportingUserParents } from "../../utilities/application-utils";
import { StudentAppealControllerService } from "../../route-controllers";

@Injectable()
export class FormSubmissionControllerService {
  constructor(
    private readonly formSubmissionService: FormSubmissionService,
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly studentAppealControllerService: StudentAppealControllerService,
  ) {}

  async getValidatedFormItems(
    payload: FormSubmissionAPIInDTO,
    studentId: number,
  ): Promise<{ items: FormSubmissionModel[]; formCategory: FormCategory }> {
    const submissionConfigs =
      this.formSubmissionService.convertToFormSubmissionConfigs(payload.items);
    // Validate the form configurations in the submission items.
    this.formSubmissionService.validatedFormConfiguration(
      submissionConfigs,
      payload.applicationId,
    );
    const [referenceConfig] = submissionConfigs;
    let supplementaryData: KnownSupplementaryData | undefined = undefined;
    if (
      referenceConfig.formCategory === FormCategory.StudentAppeal &&
      payload.applicationId
    ) {
      // Ensures the appeals are validated based on the eligibility criteria used for fetching the
      // eligible applications for appeal using getEligibleApplicationsForAppeal endpoint.
      const [eligibleApplication] =
        await this.studentAppealService.getEligibleApplicationsForAppeal(
          studentId,
          { applicationId: payload.applicationId },
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
      this.studentAppealControllerService.validateAppealFormNames(
        formNames,
        eligibleApplication.currentAssessment.eligibleApplicationAppeals,
      );
      // Get the supplementary data for the form submission which are required to be populated
      // at the server side during the dry run submission.
      supplementaryData = await this.getSupplementaryDataForFormSubmission(
        studentId,
        payload.applicationId,
      );
    }
    // Check if there is any existing form submission pending a decision for the same context.
    const existingFormSubmission =
      await this.formSubmissionService.hasPendingFormSubmission(
        studentId,
        payload.applicationId,
        referenceConfig.formCategory,
      );
    if (existingFormSubmission) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          "There is already a form submission pending a decision for the same context.",
          "FORM_SUBMISSION_PENDING_DECISION",
        ),
      );
    }
    // Process all the dry run submissions to validate the requests.
    const items = await processInParallel(
      (submissionConfig) =>
        this.getValidatedFormSubmission(submissionConfig, supplementaryData),
      submissionConfigs,
    );
    return { items, formCategory: referenceConfig.formCategory };
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

  private async getValidatedFormSubmission(
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
      throw new BadRequestException(
        "Not able to complete the submission due to an invalid request.",
      );
    }
    return {
      dynamicConfigurationId: submissionItem.dynamicConfigurationId,
      formData: submissionResult.data.data,
      files: submissionItem.files,
    };
  }
}
