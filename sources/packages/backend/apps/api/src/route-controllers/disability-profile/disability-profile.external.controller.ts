import { Controller, Get } from "@nestjs/common";
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
import { DisabilityProfileExternalAPIOutDTO } from "./models/disability-profile.dto";
import { ExternalRole } from "../../auth";

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
   * @returns all active disability profiles.
   */
  @Roles(ExternalRole.StudentDisabilityProfiles)
  @Get()
  async getAllDisabilityProfiles(): Promise<
    DisabilityProfileExternalAPIOutDTO[]
  > {
    const activeDisabilityProfiles =
      await this.disabilityProfileService.getAllActiveDisabilityProfiles(
        new Date("2024-01-01"),
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
