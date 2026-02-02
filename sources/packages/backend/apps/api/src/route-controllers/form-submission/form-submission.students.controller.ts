import {
  Controller,
  Post,
  Body,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  Get,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  FormSubmissionModel,
  FormSubmissionService,
  StudentAppealService,
} from "../../services";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionAPIOutDTO,
  FormSubmissionsAPIOutDTO,
} from "./models/form-submission.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import {
  ApiTags,
  ApiNotFoundResponse,
  ApiUnprocessableEntityResponse,
  ApiBadRequestResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ClientTypeBaseRoute,
  ApiProcessError,
  DryRunSubmissionResult,
} from "../../types";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
} from "../../constants";
import { getSupportingUserParents } from "../../utilities";
import { Application, FormCategory } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Student}-form-submission`)
export class FormSubmissionStudentsController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
    private readonly formSubmissionService: FormSubmissionService,
  ) {
    super();
  }

  @Get()
  async getFormSubmissionSummary(
    @UserToken() userToken: StudentUserToken,
  ): Promise<FormSubmissionsAPIOutDTO> {
    const studentSubmissions =
      await this.formSubmissionService.getFormSubmissionsByStudentId(
        userToken.studentId,
      );
    const submissions = studentSubmissions.map<FormSubmissionAPIOutDTO>(
      (submission) => {
        return {
          id: submission.id,
          formCategory: submission.formCategory,
          status: submission.submissionStatus,
          submissionItems: submission.formSubmissionItems.map((item) => ({
            formType: item.dynamicFormConfiguration.formType,
            decisionStatus: item.decisionStatus,
            decisionDate: item.decisionDate,
          })),
          applicationId: submission.application?.id,
          applicationNumber: submission.application?.applicationNumber,
          assessedDate: submission.assessedDate,
          submittedDate: submission.submittedDate,
        };
      },
    );
    return { submissions };
  }

  /**
   * Submit a student appeal associated with an application.
   * @param applicationId application for which the appeal is submitted.
   * @param payload student appeal with appeal requests.
   */
  @ApiNotFoundResponse({
    description:
      "Application either not found or not eligible to submit change request/appeal.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Only one change request/appeal can be submitted at a time for each application. " +
      "When your current request is approved or denied by StudentAid BC, you will be able to submit a new one or " +
      "the submitted appeal form(s) are not eligible for the application or " +
      "the application is not eligible to submit an appeal or " +
      "the application is no longer eligible to submit change request/appeal.",
  })
  @ApiBadRequestResponse({
    description:
      "Not able to submit change request/appeal due to invalid request.",
  })
  @Post()
  async submitApplicationAppeal(
    @Body() payload: FormSubmissionAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const submissionConfigs =
      this.formSubmissionService.convertToFormSubmissionConfigs(payload.items);
    // Validate the form configurations in the submission items.
    this.formSubmissionService.validatedFormConfiguration(
      submissionConfigs,
      payload.applicationId,
    );
    const [referenceConfig] = submissionConfigs;
    if (
      referenceConfig.formCategory === FormCategory.StudentAppeal &&
      payload.applicationId
    ) {
      // Ensures the appeals are validated based on the eligibility criteria used for fetching the
      // eligible applications for appeal using getEligibleApplicationsForAppeal endpoint.
      const [eligibleApplication] =
        await this.studentAppealService.getEligibleApplicationsForAppeal(
          userToken.studentId,
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
      const eligibleAppealForms = new Set(
        eligibleApplication.currentAssessment.eligibleApplicationAppeals,
      );
      const formNames = submissionConfigs.map(
        (config) => config.formDefinitionName,
      );
      const ineligibleFormNames = formNames.filter(
        (formName) => !eligibleAppealForms.has(formName),
      );
      if (ineligibleFormNames.length) {
        throw new UnprocessableEntityException(
          `The submitted appeal form(s) ${ineligibleFormNames.join(", ")} is/are not eligible for the application.`,
        );
      }
    }
    let application: Application;
    if (payload.applicationId) {
      // Execute application validations.
      application = await this.applicationService.getApplicationToRequestAppeal(
        payload.applicationId,
        userToken.studentId,
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
    // Check if there is any existing form submission pending a decision for the same context.
    const existingFormSubmission =
      await this.formSubmissionService.hasPendingFormSubmission(
        userToken.studentId,
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
    let dryRunSubmissionResults: DryRunSubmissionResult[] = [];
    try {
      const dryRunPromise: Promise<DryRunSubmissionResult>[] =
        submissionConfigs.map((submissionItem) => {
          // Check if the form has any inputs which are required to be populated at the server side
          // during the dry run submission.
          if (submissionItem.formData.programYear) {
            submissionItem.formData.programYear =
              application?.programYear.programYear;
          }
          if (submissionItem.formData.parents) {
            const parents = getSupportingUserParents(
              application?.supportingUsers,
            );
            submissionItem.formData.parents = parents;
          }
          return this.formService.dryRunSubmission(
            submissionItem.formDefinitionName,
            submissionItem.formData,
            { dynamicConfigurationId: submissionItem.dynamicConfigurationId },
          );
        });
      dryRunSubmissionResults = await Promise.all(dryRunPromise);
    } catch (error: unknown) {
      throw new Error("Dry run submission failed due to unknown reason.", {
        cause: error,
      });
    }
    const invalidRequest = dryRunSubmissionResults.some(
      (result) => !result.valid,
    );
    if (invalidRequest) {
      throw new BadRequestException(
        "Not able to complete the submission due to an invalid request.",
      );
    }
    // Generate the data to be persisted based on the result of the dry run submission.
    const formItems = dryRunSubmissionResults.map((dryRunResult) => {
      const submissionConfig = submissionConfigs.find(
        (config) =>
          config.dynamicConfigurationId === dryRunResult.dynamicConfigurationId,
      );
      return {
        dynamicConfigurationId: dryRunResult.dynamicConfigurationId,
        formData: dryRunResult.data.data,
        files: submissionConfig.files,
      } as FormSubmissionModel;
    });
    const studentAppeal = await this.formSubmissionService.saveFormSubmission(
      userToken.studentId,
      payload.applicationId,
      referenceConfig.formCategory,
      formItems,
      userToken.userId,
    );
    return {
      id: studentAppeal.id,
    };
  }
}
