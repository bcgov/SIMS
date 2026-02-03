import { Controller, Get, Param, ParseEnumPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty } from "../../auth/decorators/authorized-party.decorator";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { SystemLookupCategory } from "@sims/sims-db";
import { SystemLookupConfigurationService } from "@sims/services/system-lookup-configuration";
import { SystemLookupEntriesAPIOutDTO } from "..";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@Controller("system-lookup-configuration")
@ApiTags("system-lookup-configuration")
export class SystemLookupConfigurationController extends BaseController {
  constructor(
    private readonly systemLookupConfigurationService: SystemLookupConfigurationService,
  ) {
    super();
  }

  /**
   * Get system lookup entries by category.
   * @param lookupCategory lookup category.
   * @returns system lookup entries.
   */
  @Get("lookup-category/:lookupCategory")
  async getSystemLookupEntriesByCategory(
    @Param("lookupCategory", new ParseEnumPipe(SystemLookupCategory))
    lookupCategory: SystemLookupCategory,
  ): Promise<SystemLookupEntriesAPIOutDTO> {
    const lookupResult =
      this.systemLookupConfigurationService.getLookupByCategory(lookupCategory);
    return {
      items: lookupResult.map((lookup) => ({
        lookupKey: lookup.lookupKey,
        lookupValue: lookup.lookupValue,
      })),
    };
  }
}
