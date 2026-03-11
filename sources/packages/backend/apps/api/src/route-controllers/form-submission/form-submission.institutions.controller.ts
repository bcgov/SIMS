import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { AuthorizedParties, IInstitutionUserToken } from "../../auth";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  UserToken,
} from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { FormSubmissionControllerService } from "./form-submission.controller.service";
import {
  FormSubmissionAPIOutDTO,
  FormSubmissionsAPIOutDTO,
} from "./models/form-submission.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId")
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Institution}-form-submission`)
export class FormSubmissionInstitutionsController extends BaseController {
  constructor(
    private readonly formSubmissionControllerService: FormSubmissionControllerService,
  ) {
    super();
  }

  /**
   * Gets the list of form submissions for a student, including the individual form items and their details.
   * The form submissions with application scope will be restricted to the locations the user has access.
   * All form submissions without application scope can be retrieved as long as the user has access to the student data.
   * @param studentId student ID to retrieve the form submission history for.
   * @returns list of form submissions for a student.
   */
  @Get("student/:studentId")
  async getFormSubmissionHistory(
    @Param("studentId", ParseIntPipe) studentId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<FormSubmissionsAPIOutDTO> {
    const submissions =
      await this.formSubmissionControllerService.getFormSubmissions(studentId, {
        includeBasicDecisionDetails: true,
        keepPendingDecisionsWhilePendingFormSubmission: true,
        locationIds: userToken.authorizations.getLocationsIds(),
      });
    return {
      submissions,
    };
  }

  /**
   * Get the details of a form submission, including the individual form items and their details.
   * Please note currently the institution can only access form submissions related to their students
   * and applications.
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @param studentId student ID for authorization and to ensure the form submission belongs
   * to the institution's student.
   * @param applicationId application ID to ensure the institution has access to the
   * student's application related to the form submission.
   * @returns form submission details including individual form items and their details.
   */
  @ApiNotFoundResponse({ description: "Form submission not found." })
  @Get("student/:studentId/form-submission/:formSubmissionId")
  async getFormSubmission(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<FormSubmissionAPIOutDTO> {
    const [submission] =
      await this.formSubmissionControllerService.getFormSubmissions(studentId, {
        formSubmissionId,
        includeBasicDecisionDetails: true,
        keepPendingDecisionsWhilePendingFormSubmission: true,
        locationIds: userToken.authorizations.getLocationsIds(),
      });
    return submission;
  }
}
