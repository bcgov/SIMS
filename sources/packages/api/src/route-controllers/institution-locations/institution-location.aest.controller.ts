import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiBadRequestResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import {
  InstitutionLocationAPIOutDTO,
  InstitutionLocationFormAPIInDTO,
  InstitutionLocationFormAPIOutDTO,
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
  ) {
    super();
  }

  /**
   * Controller method to get institution locations with designation status for the given institution.
   * @param institutionId
   * @returns Institution locations form.io for drop down.
   */
  @Get("/:institutionId")
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
   * @param institutionId
   * @param locationId
   * @returns institution location.
   */
  @Get(":institutionId/:locationId")
  async getInstitutionLocation(
    @Param("institutionId") institutionId: number,
    @Param("locationId") locationId: number,
  ): Promise<InstitutionLocationFormAPIOutDTO> {
    return this.locationControllerService.getInstitutionLocation(
      institutionId,
      locationId,
    );
  }

  /**
   * Update an institution location.
   * @param locationId
   * @param institutionId
   * @param payload
   * @returns number of updated rows.
   */
  @ApiBadRequestResponse({
    description: "Invalid request to update the institution location.",
  })
  @Patch(":institutionId/:locationId")
  async update(
    @Param("institutionId") institutionId: number,
    @Param("locationId") locationId: number,
    @Body() payload: InstitutionLocationFormAPIInDTO,
  ): Promise<void> {
    return this.locationControllerService.update(
      locationId,
      payload,
      institutionId,
    );
  }
}
