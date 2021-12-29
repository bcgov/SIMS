import { Controller, Get, Param } from "@nestjs/common";
import { StudentRestrictionService } from "../../services";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import {
  StudentRestrictionSummary,
  StudentRestrictionDetail,
} from "./models/restriction.dto";
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
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      isActive: studentRestriction.isActive,
    }));
  }

  /**
   * Rest API to get the details for view student restriction.
   * @param studentId
   * @param restrictionId
   * @returns Student restriction detail view.
   */
  @Groups(UserGroups.AESTUser)
  @AllowAuthorizedParty(AuthorizedParties.aest)
  @Get("/student/:studentId/studentRestriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId") studentId: number,
    @Param("studentRestrictionId") studentRestrictionId: number,
  ): Promise<StudentRestrictionDetail> {
    const studentRestriction =
      await this.studentRestrictionService.getStudentRestrictionDetailsById(
        studentId,
        studentRestrictionId,
      );
    return {
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      updatedAt: studentRestriction.updatedAt,
      createdBy: studentRestriction.creator
        ? `${studentRestriction.creator.lastName}, ${studentRestriction.creator.firstName}`
        : "",
      updatedBy: studentRestriction.modifier
        ? `${studentRestriction.modifier.lastName}, ${studentRestriction.modifier.firstName}`
        : "",
      isActive: studentRestriction.isActive,
      restrictionNote: studentRestriction.restrictionNote?.description,
      resolutionNote: studentRestriction.resolutionNote?.description,
    };
  }
}
