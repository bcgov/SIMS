import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Query,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { PaginatedResultsAPIOutDTO } from "../models/pagination.dto";
import BaseController from "../BaseController";
import {
  AllInProgressOfferingChangePaginationOptionsAPIInDTO,
  AllInProgressApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangeDetailsAPIOutDTO,
  ApplicationOfferingChangeAssessmentAPIInDTO,
} from "./models/application-offering-change-request.dto";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { UserGroups } from "../../auth";
import { getUserFullName } from "../../utilities";
import { getISODateOnlyString } from "@sims/utilities";
import { ApplicationOfferingChangeRequestControllerService } from "./application-offering-change-request.controller.service";

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
    @Query() pagination: AllInProgressOfferingChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<AllInProgressApplicationOfferingChangesAPIOutDTO>
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
      results: offeringChange.results.map((eachOfferingChange) => {
        const offering =
          eachOfferingChange.application.currentAssessment.offering;
        return {
          id: eachOfferingChange.id,
          applicationNumber: eachOfferingChange.application.applicationNumber,
          applicationId: eachOfferingChange.application.id,
          studyStartDate: offering.studyStartDate,
          studyEndDate: offering.studyEndDate,
          fullName: getUserFullName(
            eachOfferingChange.application.student.user,
          ),
          status: eachOfferingChange.applicationOfferingChangeRequestStatus,
          createdAt: getISODateOnlyString(eachOfferingChange.createdAt),
          studentId: eachOfferingChange.application.student.id,
        };
      }),
      count: offeringChange.count,
    };
  }

  /**
   * Gets the Application Offering Change Request details.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @returns Application Offering Change Request details.
   */
  @Get(":applicationOfferingChangeRequestId")
  @ApiNotFoundResponse({
    description: "Not able to find an Application Offering Change Request.",
  })
  async getApplicationOfferingChangeRequest(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
  ): Promise<ApplicationOfferingChangeDetailsAPIOutDTO> {
    return this.applicationOfferingChangeRequestControllerService.getApplicationOfferingChangeRequest(
      applicationOfferingChangeRequestId,
      { hasAuditAndNoteDetails: true },
    );
  }

  /**
   * Updates an application offering change request.
   * @param applicationOfferingChangeRequestId application offering change request id.
   * @param payload information to update the application offering change request.
   */
  @Patch(":applicationOfferingChangeRequestId")
  async updateApplicationOfferingChangeRequest(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @Body()
    payload: ApplicationOfferingChangeAssessmentAPIInDTO,
  ): Promise<void> {
    // TODO: API to be done in the next PR.
  }
}
