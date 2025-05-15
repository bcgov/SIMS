import { Controller, Get, Query } from "@nestjs/common";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  PaginatedResultsAPIOutDTO,
  StudentAppealPendingPaginationOptionsAPIInDTO,
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

  @Get("pending")
  async getNewApplicationChangeRequests(
    @Query() pagination: StudentAppealPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestControllerService.getNewApplicationChangeRequests(
      pagination,
    );
  }
}
