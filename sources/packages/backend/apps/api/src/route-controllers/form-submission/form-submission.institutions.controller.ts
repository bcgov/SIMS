import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import { AuthorizedParties, IInstitutionUserToken } from "../../auth";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  UserToken,
} from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { FormSubmissionControllerService } from "./form-submission.controller.service";
import { FormSubmissionsAPIOutDTO } from "./models/form-submission.dto";

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
        // Institution users should not have access to form submission data.
        loadSubmittedData: false,
        locationIds: userToken.authorizations.getLocationsIds(),
      });
    return {
      submissions,
    };
  }
}
