import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import { StudentRestrictionService } from "../../services";
import BaseController from "../BaseController";
import { StudentRestrictionAPIOutDTO } from "./models/restriction.dto";

/**
 * Controller for Student Restrictions.
 * This consists of all Rest APIs for Student restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("restriction")
@ApiTags(`${ClientTypeBaseRoute.Student}-restriction`)
export class RestrictionStudentsController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }
  /**
   * GET API which returns student restriction details.
   * @returns Student restriction code and notification type, if any.
   */
  @Get()
  async getStudentRestrictions(
    @UserToken() studentToken: StudentUserToken,
  ): Promise<StudentRestrictionAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentToken.studentId,
        true,
      );

    return studentRestrictions.map((studentRestriction) => ({
      code: studentRestriction.restriction.restrictionCode,
      type: studentRestriction.restriction.notificationType,
    }));
  }
}
