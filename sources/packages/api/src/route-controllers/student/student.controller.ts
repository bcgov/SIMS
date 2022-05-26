import { Controller, Get } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import { StudentRestrictionDTO } from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import { IUserToken } from "../../auth/userToken.interface";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";

@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * GET API which returns student restriction details.
   * @param userToken
   * @returns Student Restriction
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() userToken: IUserToken,
  ): Promise<StudentRestrictionDTO> {
    const studentRestrictionStatus =
      await this.studentRestrictionService.getStudentRestrictionsByUserId(
        userToken.userId,
      );
    return {
      hasRestriction: studentRestrictionStatus.hasRestriction,
      hasFederalRestriction: studentRestrictionStatus.hasFederalRestriction,
      hasProvincialRestriction:
        studentRestrictionStatus.hasProvincialRestriction,
      restrictionMessage: studentRestrictionStatus.restrictionMessage,
    } as StudentRestrictionDTO;
  }
}
