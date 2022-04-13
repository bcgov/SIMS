import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { InstitutionLocationService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { OptionItemAPIOutDTO } from "../models/common.dto";

/**
 * Institution location controller for Students client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("institution/location")
@ApiTags(`${ClientTypeBaseRoute.Student}-institution/location`)
export class InstitutionLocationStudentsController extends BaseController {
  constructor(private readonly locationService: InstitutionLocationService) {
    super();
  }

  /**
   * Get a key/value pair list of all locations
   * from all institution available.
   * @returns key/value pair list of all locations.
   */
  @Get("options-list")
  async getOptionsList(): Promise<OptionItemAPIOutDTO[]> {
    const locations = await this.locationService.getDesignatedLocations();
    return locations.map((location) => ({
      id: location.id,
      description: location.name,
    }));
  }
}
