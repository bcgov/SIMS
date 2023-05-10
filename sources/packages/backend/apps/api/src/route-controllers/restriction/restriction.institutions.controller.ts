import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  NotFoundException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import { StudentRestrictionService } from "../../services";
import {
  RestrictionInstitutionDetailAPIOutDTO,
  RestrictionInstitutionSummaryAPIOutDTO,
} from "./models/restriction.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { getUserFullName } from "../../utilities";

/**
 * Controller for Institution Restrictions.
 * This consists of all Rest APIs for Institution restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId")
@Controller("restriction")
@ApiTags(`${ClientTypeBaseRoute.Institution}-restriction`)
export class RestrictionInstitutionsController extends BaseController {
  constructor(
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super();
  }

  /**
   * Get restrictions for a student filtered with restriction notification type other than `No effect`.
   * @param studentId id of the student to retrieve restrictions.
   * @returns Student restrictions.
   */
  @Get("student/:studentId")
  async getStudentRestrictions(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<RestrictionInstitutionSummaryAPIOutDTO[]> {
    const studentRestrictions =
      await this.studentRestrictionService.getStudentRestrictionsById(
        studentId,
        {
          filterNoEffectRestrictions: true,
        },
      );
    return studentRestrictions?.map((studentRestriction) => ({
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      isActive: studentRestriction.isActive,
    }));
  }

  /**
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @returns Student restriction detail view.
   */
  @Get("student/:studentId/student-restriction/:studentRestrictionId")
  @ApiNotFoundResponse({
    description: "The student restriction does not exist.",
  })
  async getStudentRestrictionDetail(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
  ): Promise<RestrictionInstitutionDetailAPIOutDTO> {
    const studentRestriction =
      await this.studentRestrictionService.getStudentRestrictionDetailsById(
        studentId,
        studentRestrictionId,
        {
          filterNoEffectRestrictions: true,
        },
      );
    if (!studentRestriction) {
      throw new NotFoundException("The student restriction does not exist.");
    }
    return {
      restrictionId: studentRestriction.id,
      restrictionType: studentRestriction.restriction.restrictionType,
      restrictionCategory: studentRestriction.restriction.restrictionCategory,
      restrictionCode: studentRestriction.restriction.restrictionCode,
      description: studentRestriction.restriction.description,
      createdAt: studentRestriction.createdAt,
      createdBy: getUserFullName(studentRestriction.creator),
      isActive: studentRestriction.isActive,
      restrictionNote: studentRestriction.restrictionNote?.description,
    };
  }
}
