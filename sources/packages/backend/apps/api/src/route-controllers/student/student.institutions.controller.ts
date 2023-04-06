import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { StudentService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import BaseController from "../BaseController";
import {
  StudentSearchAPIInDTO,
  SearchStudentAPIOutDTO,
} from "./models/student.dto";
import { IInstitutionUserToken } from "../../auth";
import { StudentControllerService } from "./student.controller.service";

/**
 * Student controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.Institution}-student`)
export class StudentInstitutionsController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly studentControllerService: StudentControllerService,
  ) {
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
    const students = await this.studentService.searchStudent(
      searchCriteria,
      userToken.authorizations.institutionId,
    );
    return this.studentControllerService.transformStudentsToSearchStudentDetails(
      students,
    );
  }
}
