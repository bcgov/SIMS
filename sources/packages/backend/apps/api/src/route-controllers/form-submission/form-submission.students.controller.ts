import { Body, Controller, Get, Post } from "@nestjs/common";
import {
  DynamicFormConfigurationService,
  FormSubmissionService,
} from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { FormCategory } from "@sims/sims-db";
import {
  FormSubmissionAPIInDTO,
  FormSubmissionConfigurationsAPIOutDTO,
} from "./models/form-submission.dto";
import { StudentUserToken } from "apps/api/src/auth";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { FormSubmissionControllerService } from "./form-submission.controller.service";

@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Student}-form-submission`)
export class FormSubmissionStudentsController extends BaseController {
  constructor(
    private readonly dynamicFormConfigurationService: DynamicFormConfigurationService,
    private readonly formSubmissionService: FormSubmissionService,
    private readonly formSubmissionControllerService: FormSubmissionControllerService,
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
   * Submits forms represents appeals or other students forms for Ministry's decision.
   * The submission will be processed based on the form category and the related business rules.
   * @param userToken user token of the student submitting the forms.
   * @param payload form submission with one or more form items.
   * @returns the id of the created form submission record that holds all the individual form items.
   */
  // TODO: Review the API response and error handling.
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
  async submitForm(
    @Body() payload: FormSubmissionAPIInDTO,
    @UserToken() userToken: StudentUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const { items, formCategory } =
        await this.formSubmissionControllerService.getValidatedFormItems(
          payload,
          userToken.studentId,
        );
      const studentAppeal = await this.formSubmissionService.saveFormSubmission(
        userToken.studentId,
        payload.applicationId,
        formCategory,
        items,
        userToken.userId,
      );
      return {
        id: studentAppeal.id,
      };
    } catch (error: unknown) {
      throw new Error("Failed to submit the form due to unknown reason.", {
        cause: error,
      });
    }
  }
}
