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

  /**
   * Gets all pending application change requests (regardless of program year)
   * Legacy endpoint for backward compatibility.
   * @param pagination options to execute the pagination.
   * @returns list of pending application change requests.
   */
  @Get("pending")
  async getApplicationChangeRequests(
    @Query() pagination: StudentAppealPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestControllerService.getPendingApplicationChangeRequests(
      pagination,
    );
  }

  /**
   * Gets all new application change requests for 2025-2026 program year and later.
   * @param pagination options to execute the pagination.
   * @returns list of pending application change requests for 2025-2026 and later.
   */
  @Get("new/pending")
  async getNewApplicationChangeRequests(
    @Query() pagination: StudentAppealPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestControllerService.getNewApplicationChangeRequests(
      pagination,
    );
  }

  /**
   * Gets all application change requests for program years before 2025-2026.
   * @param pagination options to execute the pagination.
   * @returns list of pending application change requests for program years before 2025-2026.
   */
  @Get("legacy/pending")
  async getLegacyApplicationChangeRequests(
    @Query() pagination: StudentAppealPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestControllerService.getLegacyApplicationChangeRequests(
      pagination,
    );
  }
}
