import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { ApplicationBaseAPIOutDTO } from "./models/application.dto";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
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
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplication(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      { loadDynamicData: true },
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
