import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import {
  InstitutionActiveRestrictionsAPIOutDTO,
  RestrictionInstitutionDetailAPIOutDTO,
  RestrictionInstitutionSummaryAPIOutDTO,
} from "./models/restriction.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
  UserToken,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { RestrictionControllerService } from "./restriction.controller.service";
import { IInstitutionUserToken } from "../../auth";

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
    private readonly restrictionControllerService: RestrictionControllerService,
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
    return this.restrictionControllerService.getStudentRestrictions(studentId, {
      filterNoEffectRestrictions: true,
    });
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
    return this.restrictionControllerService.getStudentRestrictionDetail(
      studentId,
      studentRestrictionId,
      {
        filterNoEffectRestrictions: true,
      },
    );
  }

  /**
   * Get active institution restrictions.
   * @returns active institution restrictions.
   */
  @Get()
  async getActiveInstitutionRestrictions(
    @UserToken() userToken: IInstitutionUserToken,
  ): Promise<InstitutionActiveRestrictionsAPIOutDTO> {
    const institutionId = userToken.authorizations.institutionId;
    const authorizedLocationIds = userToken.authorizations.getLocationsIds();
    return this.restrictionControllerService.getActiveInstitutionRestrictions(
      institutionId,
      { authorizedLocationIds, excludeNoEffectRestrictions: true },
    );
  }
}
