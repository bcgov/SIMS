import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { AuthorizedParties } from "../../auth";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { FormSubmissionControllerService } from "./form-submission.controller.service";
import { FormSubmissionAPIOutDTO } from "./models/form-submission.dto";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("form-submission")
@ApiTags(`${ClientTypeBaseRoute.Institution}-form-submission`)
export class FormSubmissionInstitutionsController extends BaseController {
  constructor(
    private readonly formSubmissionControllerService: FormSubmissionControllerService,
  ) {
    super();
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
  @HasStudentDataAccess("studentId", "applicationId")
  @Get(
    "student/:studentId/application/:applicationId/form-submission/:formSubmissionId",
  )
  async getFormSubmission(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  ): Promise<FormSubmissionAPIOutDTO> {
    return this.formSubmissionControllerService.getFormSubmission(
      formSubmissionId,
      studentId,
      { includeBasicDecisionDetails: true, applicationId },
    );
  }
}
