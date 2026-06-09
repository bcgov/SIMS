import { BadRequestException, Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
  Roles,
} from "../../auth/decorators";
import { DisabilityProfileService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  DisabilityProfileExternalAPIOutDTO,
  DisabilityProfilesQueryExternalAPIInDTO,
} from "./models/disability-profile.dto";
import { ExternalRole } from "../../auth";
import { addDays, isAfter, isBeforeDate } from "@sims/utilities";
import { DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS } from "../../utilities";

/**
 * Disability profile controller for external client.
 */
@RequiresUserAccount(false)
@AllowAuthorizedParty(AuthorizedParties.external)
@Controller("disability-profile")
@ApiTags(`${ClientTypeBaseRoute.External}-disability-profile`)
export class DisabilityProfileExternalController extends BaseController {
  constructor(
    private readonly disabilityProfileService: DisabilityProfileService,
  ) {
    super();
  }

  /**
   * Gets all active disability profiles for the students with valid SIN numbers.
   * @param disabilityProfilesQuery query parameters to retrieve the disability profiles.
   * @returns all active disability profiles.
   */
  @Roles(ExternalRole.StudentDisabilityProfiles)
  @Get()
  async getAllDisabilityProfiles(
    @Query() disabilityProfilesQuery: DisabilityProfilesQueryExternalAPIInDTO,
  ): Promise<DisabilityProfileExternalAPIOutDTO[]> {
    const modifiedUntil = new Date();
    const modifiedSince = new Date(disabilityProfilesQuery.modifiedSince);
    // The minimum date-time value that modifiedSince can have.
    const minModifiedSince = addDays(
      -DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS,
      modifiedUntil,
    );
    // Validates that the modifiedSince must be within allowed number of days and not in the future.
    const isModifiedSinceValid =
      isAfter(minModifiedSince, modifiedSince) &&
      isBeforeDate(modifiedSince, modifiedUntil);
    if (!isModifiedSinceValid) {
      throw new BadRequestException(
        `Modified since must be a date within the last ${DISABILITY_PROFILES_MODIFIED_SINCE_MAX_DAYS} days and not in the future.`,
      );
    }
    const activeDisabilityProfiles =
      await this.disabilityProfileService.getAllActiveDisabilityProfiles(
        modifiedSince,
        modifiedUntil,
      );
    return activeDisabilityProfiles.map<DisabilityProfileExternalAPIOutDTO>(
      (disabilityProfile) => ({
        firstName: disabilityProfile.student.user.firstName,
        lastName: disabilityProfile.student.user.lastName,
        sin: disabilityProfile.student.sinValidation.sin,
        disabilities: disabilityProfile.disabilities.map((disability) => ({
          disabilityCategory: disability.disabilityCategory,
          disabilityType: disability.disabilityType,
          disabilityNotes: disability.disabilityNotes || undefined,
          diagnosis: disability.diagnosis,
          diagnosisNotes: disability.diagnosisNotes || undefined,
          impairments: disability.impairments,
          impairmentsNotes: disability.impairmentsNotes || undefined,
          finalNotes: disability.finalNotes || undefined,
        })),
      }),
    );
  }
}
