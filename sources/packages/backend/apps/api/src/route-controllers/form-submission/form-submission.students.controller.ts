import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  FORM_SUBMISSION_INVALID_DYNAMIC_DATA,
  FORM_SUBMISSION_PENDING_DECISION,
  FormSubmissionService,
  FormSubmissionSubmitService,
} from "../../services";
import { AuthorizedParties, StudentUserToken } from "../../auth";
import {
  UserToken,
  AllowAuthorizedParty,
  RequiresStudentAccount,
} from "../../auth/decorators";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  FormCategory,
  FormSubmissionDecisionStatus,
  FormSubmissionStatus,
} from "@sims/sims-db";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionConfigurationsAPIOutDTO,
  FormSubmissionStudentAPIOutDTO,
  FormSupplementaryDataAPIInDTO,
  FormSupplementaryDataAPIOutDTO,
} from "./models/form-submission.dto";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { CustomNamedError } from "@sims/utilities";
import { SupplementaryDataLoader } from "../../services/form-submission/form-supplementary-data/form-supplementary-data-loader";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Student}-form-submission`)
export class FormSubmissionStudentsController extends BaseController {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly formSubmissionSubmitService: FormSubmissionSubmitService,
    private readonly supplementaryDataLoader: SupplementaryDataLoader,
    private readonly formSubmissionService: FormSubmissionService,
  ) {
    super();
  }

  /**
   * Get all submission form configurations for student submission forms.
   * @returns form configurations that allow student submissions.
   */
  @Get("forms")
  async getSubmissionForms(): Promise<FormSubmissionConfigurationsAPIOutDTO> {
    const studentForms =
      this.dynamicFormConfigurationService.getFormsByCategory(
        FormCategory.StudentForm,
        FormCategory.StudentAppeal,
      );
    return {
      configurations: studentForms.map((configuration) => ({
        id: configuration.id,
        formDefinitionName: configuration.formDefinitionName,
        formType: configuration.formType,
        formCategory: configuration.formCategory,
        formDescription: configuration.formDescription,
        allowBundledSubmission: configuration.allowBundledSubmission,
        hasApplicationScope: configuration.hasApplicationScope,
      })),
    };
  }

  /**
   * Get supplementary data for the given data keys and application ID if provided.
   * @param query data keys and application ID to retrieve the supplementary data for.
   * @returns supplementary data for the given data keys and application ID.
   */
  @Get("supplementary-data")
  async getSupplementaryData(
    @Query() query: FormSupplementaryDataAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<FormSupplementaryDataAPIOutDTO> {
    const formData = await this.supplementaryDataLoader.getSupplementaryData(
      query.dataKeys,
      query.applicationId,
      userToken.studentId,
    );
    return {
      formData,
    };
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param itemId optional ID of the form submission item to filter the details for.
   * Useful only when a single item detail is required.
   * @returns form submission details including individual form items and their details.
   */
  @ApiNotFoundResponse({ description: "Form submission not found" })
  @Get(":formSubmissionId")
  async getFormSubmission(
    @UserToken() userToken: StudentUserToken,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  ): Promise<FormSubmissionStudentAPIOutDTO> {
    const submission = await this.formSubmissionService.getFormSubmissionsById(
      formSubmissionId,
      { studentId: userToken.studentId },
    );
    if (!submission) {
      throw new NotFoundException(
        `Form submission with ID ${formSubmissionId} not found.`,
      );
    }
    return {
      id: submission.id,
      formCategory: submission.formCategory,
      status: submission.submissionStatus,
      applicationId: submission.application?.id,
      applicationNumber: submission.application?.applicationNumber,
      submittedDate: submission.submittedDate,
      submissionItems: submission.formSubmissionItems.map((item) => ({
        id: item.id,
        formType: item.dynamicFormConfiguration.formType,
        formCategory: item.dynamicFormConfiguration.formCategory,
        dynamicFormConfigurationId: item.dynamicFormConfiguration.id,
        submissionData: item.submittedData,
        formDefinitionName: item.dynamicFormConfiguration.formDefinitionName,
        decisionStatus:
          submission.submissionStatus === FormSubmissionStatus.Pending
            ? FormSubmissionDecisionStatus.Pending
            : (item.currentDecision?.decisionStatus ??
              FormSubmissionDecisionStatus.Pending),
      })),
    };
  }

  /**
   * Executes a dynamic form submission for the Ministry decision.
   * Each form will have an individual decision associated with and upon its
   * approval, may trigger different actions in the system based on the form type.
   * @param payload one to many form submissions for the Ministry decision.
   * @returns ID for the newly created form submission.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "There is already a pending form submission for the same context or " +
      "one or more forms configurations in the submission are not recognized or " +
      "all forms in the submission must have the same application scope or " +
      "all forms in the submission must have an application ID when they have application scope or " +
      "one or more forms in the submission do not allow bundled submissions or " +
      "all forms in the submission must share the same form category or " +
      "the application is not eligible for an appeal or " +
      "the submitted appeal form(s) is/are not eligible for the application.",
  })
  @ApiBadRequestResponse({
    description: "Failed to submit the form due to invalid dynamic data.",
  })
  @Post()
  async submitForm(
    @Body() payload: FormSubmissionAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const submission =
        await this.formSubmissionSubmitService.saveFormSubmission(
          userToken.studentId,
          payload.applicationId,
          payload.items,
          userToken.userId,
        );
      return {
        id: submission.id,
      };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case FORM_SUBMISSION_INVALID_DYNAMIC_DATA:
            throw new BadRequestException(
              "Failed to submit the form due to invalid dynamic data.",
            );
          case FORM_SUBMISSION_PENDING_DECISION:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          default:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
