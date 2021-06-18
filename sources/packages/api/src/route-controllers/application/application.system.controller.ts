import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApplicationService } from "../../services";
import { GetApplicationDataDto } from "./models/application.model";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";

/**
 * Allow system access to the application data.
 * System access will give the ability to request acess from any
 * student data. This is required for external systems (e.g. workflow)
 * to process and have access to all data as needed.
 */
@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("system-access/application")
export class ApplicationSystemController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Get(":id")
  async getByApplicationId(
    @Param("id") applicationId: number,
  ): Promise<GetApplicationDataDto> {
    const application = await this.applicationService.findById(applicationId);
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    return { data: application.data };
  }
}
