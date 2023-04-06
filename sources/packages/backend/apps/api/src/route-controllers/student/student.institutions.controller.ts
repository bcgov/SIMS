import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { InstitutionService, StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import BaseController from "../BaseController";
import {
  StudentSearchAPIInDTO,
  SearchStudentAPIOutDTO,
} from "./models/student.dto";
import { IInstitutionUserToken } from "../../auth";

/**
 * Student controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.Institution}-student`)
export class StudentInstitutionsController extends BaseController {
  constructor(private readonly studentService: StudentService) {
    super();
  }

  /**
   * Search students based on the search criteria.
   * TODO add decorator to restrict to BC Public institutions.
   * @param searchCriteria criteria to be used in the search.
   * @returns searched student details.
   */
  @Post("search")
  async searchStudents(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() searchCriteria: StudentSearchAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    return this.studentService.searchStudentApplication(
      searchCriteria,
      userToken.authorizations.institutionId,
    );
  }
}
