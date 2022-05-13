import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { InstitutionLocationService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import {
  AESTInstitutionLocationAPIInDTO,
  InstitutionLocationAPIOutDTO,
  InstitutionLocationDetailsAPIOutDTO,
} from "./models/institution-location.dto";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("institution/location")
@ApiTags(`${ClientTypeBaseRoute.AEST}-institution/location`)
export class InstitutionLocationAESTController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @param institutionId
   * @returns Institution locations form.io for drop down.
   */
  @Get(":institutionId")
  async getAllInstitutionLocations(
    @Param("institutionId") institutionId: number,
  ): Promise<InstitutionLocationAPIOutDTO[]> {
    // get all institution locations with designation statuses.
    return this.locationControllerService.getInstitutionLocations(
      institutionId,
    );
  }

  /**
   * Controller method to retrieve institution location by id.
   * TODO: updating of API routes will be handled in PART 2 PR
   * @param locationId
   * @returns institution location.
   */
  @Get(":locationId/getLocation")
  @ApiNotFoundResponse({ description: "Institution Location not found." })
  async getInstitutionLocation(
    @Param("locationId") locationId: number,
  ): Promise<InstitutionLocationDetailsAPIOutDTO> {
    // Get particular institution location.
    return this.locationControllerService.getInstitutionLocation(locationId);
  }

  /**
   * Update an institution location.
   * @param locationId
   * @param payload
   */
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: AESTInstitutionLocationAPIInDTO,
  ): Promise<void> {
    this.locationService.updateLocation(payload, locationId);
  }
}
