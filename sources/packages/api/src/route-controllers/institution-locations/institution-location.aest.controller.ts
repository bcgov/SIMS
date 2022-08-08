import { Body, Controller, Get, Param, Patch } from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { InstitutionLocationService } from "../../services";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { InstitutionLocationControllerService } from "./institution-location.controller.service";
import {
  AESTInstitutionLocationAPIInDTO,
  InstitutionLocationDetailsAPIOutDTO,
} from "./models/institution-location.dto";
import { Role } from "../../auth/roles.enum";

/**
 * Institution location controller for institutions Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("location")
@ApiTags(`${ClientTypeBaseRoute.AEST}-location`)
export class InstitutionLocationAESTController extends BaseController {
  constructor(
    private readonly locationControllerService: InstitutionLocationControllerService,
    private readonly locationService: InstitutionLocationService,
  ) {
    super();
  }

  /**
   * Controller method to retrieve institution location by id.
   * @param locationId
   * @returns institution location.
   */
  @Get(":locationId")
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
  @Roles(Role.InstitutionEditLocationDetails)
  @Patch(":locationId")
  async update(
    @Param("locationId") locationId: number,
    @Body() payload: AESTInstitutionLocationAPIInDTO,
  ): Promise<void> {
    this.locationService.updateLocation(payload, locationId);
  }
}
