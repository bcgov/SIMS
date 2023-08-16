import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { PaginatedResultsAPIOutDTO } from "../models/pagination.dto";
import BaseController from "../BaseController";
import {
  InProgressApplicationOfferingChangesAPIOutDTO,
  InProgressOfferingChangePaginationOptionsAPIInDTO,
} from "./models/application-offering-change-request.institutions.dto";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { UserGroups } from "../../auth";
import { ApplicationOfferingChangeRequestControllerService } from "..";

/**
 * Application offering change request controller for ministry client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-offering-change-request")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-offering-change-request`)
export class ApplicationOfferingChangeRequestAESTController extends BaseController {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly applicationOfferingChangeRequestControllerService: ApplicationOfferingChangeRequestControllerService,
  ) {
    super();
  }

  /**
   * Get all in progress application offering change requests.
   * @param pagination options to execute the pagination.
   * @returns list and count of in progress application offering change requests.
   */
  @Get("in-progress")
  async getAllInProgressApplications(
    @Query() pagination: InProgressOfferingChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<InProgressApplicationOfferingChangesAPIOutDTO>
  > {
    const offeringChange =
      await this.applicationOfferingChangeRequestService.getSummaryByStatus(
        [
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
        ],
        pagination,
      );
    return {
      results:
        this.applicationOfferingChangeRequestControllerService.mapToInProgressApplicationOfferingChangesAPIOutDTOs(
          offeringChange,
        ),
      count: offeringChange.count,
    };
  }
}
