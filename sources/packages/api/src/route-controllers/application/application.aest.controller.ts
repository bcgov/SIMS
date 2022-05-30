import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { GetApplicationBaseDTO } from "./models/application.model";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApiNotFoundResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application`)
export class ApplicationAESTController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by ministry users.
   * @param applicationId
   * @returns Application details
   */
  @Get(":applicationId")
  @ApiOkResponse({ description: "Application details fetched." })
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplication(
    @Param("applicationId") applicationId: number,
  ): Promise<GetApplicationBaseDTO> {
    const application = await this.applicationService.getApplicationByIdAndUser(
      applicationId,
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    return this.applicationControllerService.transformToApplicationForAESTDTO(
      application,
    );
  }
}
