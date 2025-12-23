import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { StudentUserToken } from "../../auth/userToken.interface";
import {
  InstitutionRestrictionService,
  InstitutionService,
  StudentRestrictionService,
} from "../../services";
import BaseController from "../BaseController";
import {
  InstitutionRestrictionAPIOutDTO,
  InstitutionRestrictionsAPIOutDTO,
  StudentRestrictionAPIOutDTO,
} from "./models/restriction.dto";
import { RestrictionNotificationType, StudentRestriction } from "@sims/sims-db";
import { DEFAULT_LEGACY_RESTRICTION_CODE } from "@sims/services/constants";

/**
 * Restriction notifications priority order.
 * Priority 1 indicates the most important notification.
 */
const NOTIFICATION_PRIORITY_ORDER_MAP = {
  [RestrictionNotificationType.Error]: 1,
  [RestrictionNotificationType.Warning]: 2,
};

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
    private readonly institutionRestrictionService: InstitutionRestrictionService,
    private readonly institutionService: InstitutionService,
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
        {
          onlyActive: true,
          filterNoEffectRestrictions: true,
        },
      );
    // Separate the results between non-legacy and legacy restrictions.
    const nonLegacyRestrictions: StudentRestriction[] = [];
    const legacyRestrictions: StudentRestriction[] = [];
    studentRestrictions.forEach((studentRestriction) => {
      const resultList = studentRestriction.restriction.isLegacy
        ? legacyRestrictions
        : nonLegacyRestrictions;
      resultList.push(studentRestriction);
    });
    // Create the output result for non-legacy restrictions.
    const results = nonLegacyRestrictions.map((studentRestriction) => ({
      code: studentRestriction.restriction.restrictionCode,
      type: studentRestriction.restriction.notificationType,
    }));
    if (legacyRestrictions.length) {
      // If any legacy restriction is present, create a generic LGCY restriction
      // with the highest notification type.
      studentRestrictions.sort(
        (a, b) =>
          NOTIFICATION_PRIORITY_ORDER_MAP[a.restriction.notificationType] -
          NOTIFICATION_PRIORITY_ORDER_MAP[b.restriction.notificationType],
      );
      const [legacyRestriction] = studentRestrictions;
      results.push({
        code: DEFAULT_LEGACY_RESTRICTION_CODE,
        type: legacyRestriction.restriction.notificationType,
      });
    }
    return results;
  }

  /**
   * Get institution restrictions effective for the given program and institution location.
   * @param locationId institution location.
   * @param programId institution program.
   * @returns institution restrictions.
   */
  @Get("institution/location/:locationId/program/:programId")
  async getLocationProgramInstitutionRestrictions(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("programId", ParseIntPipe) programId: number,
  ): Promise<InstitutionRestrictionsAPIOutDTO> {
    const institutionExists =
      await this.institutionService.institutionWithLocationAndProgramExists(
        locationId,
        programId,
      );
    if (!institutionExists) {
      throw new NotFoundException(
        "Institution with the program and location not found.",
      );
    }
    const institutionRestrictions =
      await this.institutionRestrictionService.getInstitutionRestrictionsByLocationAndProgram(
        locationId,
        programId,
        { isActive: true, excludeNoEffectRestrictions: true },
      );
    return {
      institutionRestrictions:
        institutionRestrictions.map<InstitutionRestrictionAPIOutDTO>(
          (restriction) => ({
            restrictionActions: restriction.restriction.actionType,
          }),
        ),
    };
  }
}
