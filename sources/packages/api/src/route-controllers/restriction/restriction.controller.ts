import { Controller, Get, Param } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { StudentRestrictionSummary } from "./models/restriction.dto";
/**
 * Controller for Restrictions.
 * This consists of all Rest APIs for restrictions.
 */
@Controller("restrictions")
export class RestrictionController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * Rest API to get restrictions for a student.
   * @param studentId
   * @returns Student Restrictions.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId")
  async getStudentRestrictions(
    @Param("studentId") studentId: number,
  ): Promise<StudentRestrictionSummary[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      isActive: studentRestriction.isActive,
    }));
  }
}
