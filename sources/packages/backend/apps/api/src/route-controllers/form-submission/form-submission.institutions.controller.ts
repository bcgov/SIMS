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
   * @param formSubmissionId ID of the form submission to retrieve the details for.
   * @returns form submission details including individual form items and their details.
   */
  @ApiNotFoundResponse({ description: "Form submission not found." })
  @HasStudentDataAccess("studentId")
  @Get("student/:studentId/form-submission/:formSubmissionId")
  async getFormSubmission(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("formSubmissionId", ParseIntPipe) formSubmissionId: number,
  ): Promise<FormSubmissionAPIOutDTO> {
    return this.formSubmissionControllerService.getFormSubmission(
      formSubmissionId,
      studentId,
      { includeBasicDecisionDetails: true },
    );
  }
}
