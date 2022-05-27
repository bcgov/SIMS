import { Controller, Get } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import { StudentRestrictionAPIOutDTO } from "./models/student.dto";
import { UserToken } from "../../auth/decorators/userToken.decorator";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { StudentUserToken } from "../../auth/userToken.interface";

@Controller("students")
@ApiTags("students")
export class StudentController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * TODO: This api will be called by UI and update states, in future restriction UI ticket
   * GET API which returns student restriction details.
   * @param studentToken student token.
   * @returns Student restriction code and notification type, if any.
   */
  @AllowAuthorizedParty(AuthorizedParties.student)
  @Get("restriction")
  async getStudentRestrictions(
    @UserToken() studentToken: StudentUserToken,
  ): Promise<StudentRestrictionAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentToken.studentId,
      );

    return studentRestrictions?.map((studentRestriction) => ({
      code: studentRestriction.restriction.restrictionCode,
      type: studentRestriction.restriction.notificationType,
    }));
  }
}
