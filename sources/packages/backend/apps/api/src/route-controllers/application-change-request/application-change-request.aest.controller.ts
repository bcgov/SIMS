import { Controller, Get, Query } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationChangeRequestPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./models/application-change-request.dto";
import { ApplicationChangeRequestControllerService } from "./application-change-request.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-change-request")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-change-request`)
export class ApplicationChangeRequestAESTController extends BaseController {
  constructor(
    private readonly applicationChangeRequestControllerService: ApplicationChangeRequestControllerService,
  ) {
    super();
  }

  /**
   * Gets all pending application change requests (applications in 'Change pending approval' status).
   * @param pagination options to execute the pagination.
   * @returns list of application change requests.
   */
  @Get("pending")
  async getApplicationChangeRequests(
    @Query() pagination: ApplicationChangeRequestPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestControllerService.getApplicationChangeRequests(
      pagination,
    );
  }
}
