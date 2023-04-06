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
import { INSTITUTION_TYPE_BC_PUBLIC } from "@sims/sims-db/constant";

/**
 * Student controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("student")
@ApiTags(`${ClientTypeBaseRoute.Institution}-student`)
export class StudentInstitutionsController extends BaseController {
  constructor(
    private readonly studentService: StudentService,
    private readonly institutionService: InstitutionService,
  ) {
    super();
  }

  /**
   * Search students based on the search criteria.
   * @param searchCriteria criteria to be used in the search.
   * @returns searched student details.
   */
  @Post("search")
  async searchStudents(
    @UserToken() userToken: IInstitutionUserToken,
    @Body() searchCriteria: StudentSearchAPIInDTO,
  ): Promise<SearchStudentAPIOutDTO[]> {
    const institutionType =
      await this.institutionService.getInstitutionTypeById(
        userToken.authorizations.institutionId,
      );
    if (institutionType.id !== INSTITUTION_TYPE_BC_PUBLIC) {
      return [];
    }
    return await this.studentService.searchStudentApplication(
      searchCriteria,
      userToken.authorizations.institutionId,
    );
  }
}
