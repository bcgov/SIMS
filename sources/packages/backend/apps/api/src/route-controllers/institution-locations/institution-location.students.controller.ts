import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
} from "../../auth/decorators";
import { InstitutionLocationService } from "../../services";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { OptionItemAPIOutDTO } from "../models/common.dto";
import { OfferingIntensity } from "@sims/sims-db";
import { ParseEnumQueryPipe } from "../utils/custom-validation-pipe";
import { ConfigService } from "@sims/utilities/config";

/**
 * Institution location controller for Students client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("location")
@ApiTags(`${ClientTypeBaseRoute.Student}-location`)
export class InstitutionLocationStudentsController extends BaseController {
  constructor(
    private readonly locationService: InstitutionLocationService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Get a key/value pair list of all locations
   * from all institution available.
   * @param offeringIntensity offering intensity to evaluate if only beta institution locations
   * should be returned.
   * @returns key/value pair list of all locations.
   */
  @Get("options-list")
  async getOptionsList(
    @Query("offeringIntensity", new ParseEnumQueryPipe(OfferingIntensity))
    offeringIntensity?: OfferingIntensity,
  ): Promise<OptionItemAPIOutDTO[]> {
    // For the context of full-time applications, allow only beta institution locations
    // if the beta flag is enabled.
    const onlyBetaInstitutionLocations =
      offeringIntensity === OfferingIntensity.fullTime &&
      this.configService.allowBetaInstitutionsOnly;
    const locations = await this.locationService.getDesignatedLocations(
      onlyBetaInstitutionLocations,
    );
    return locations.map((location) => ({
      id: location.id,
      description: location.name,
    }));
  }
}
