import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import {
  RestrictionSummaryAPIOutDTO,
  RestrictionDetailAPIOutDTO,
} from "./models/restriction.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import { RestrictionControllerService } from "./restriction.controller.service";

/**
 * Controller for Institution Restrictions.
 * This consists of all Rest APIs for Institution restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@Controller("restriction")
@ApiTags(`${ClientTypeBaseRoute.Institution}-restriction`)
export class RestrictionInstitutionController extends BaseController {
  constructor(
    private readonly restrictionControllerService: RestrictionControllerService,
  ) {
    super();
  }

  /**
   * Get restrictions for a student filtered with restriction notification type other than `No effect` or restriction category other than `Verification`.
   * @param studentId id of the student to retrieve restrictions.
   * @returns Student restrictions.
   */
  @HasStudentDataAccess("studentId")
  @Get("student/:studentId")
  async getStudentRestrictions(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<RestrictionSummaryAPIOutDTO[]> {
    return this.restrictionControllerService.getStudentRestrictions(studentId, {
      filterRestrictions: true,
    });
  }

  /**
   * Get the details for view student restriction.
   * @param studentId id of the student.
   * @param studentRestrictionId id of the student restriction.
   * @returns Student restriction detail view.
   */
  @HasStudentDataAccess("studentId")
  @Get("student/:studentId/studentRestriction/:studentRestrictionId")
  async getStudentRestrictionDetail(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("studentRestrictionId", ParseIntPipe) studentRestrictionId: number,
  ): Promise<RestrictionDetailAPIOutDTO> {
    return this.restrictionControllerService.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
    );
  }
}
