import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, HasLocationAccess } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { getUserFullName } from "../../utilities";
import { PaginatedResultsAPIOutDTO } from "../models/pagination.dto";
import BaseController from "../BaseController";
import {
  CompletedApplicationOfferingChangesAPIOutDTO,
  InProgressApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangeSummaryAPIOutDTO,
  OfferingChangePaginationOptionsAPIInDTO,
  InProgressOfferingChangePaginationOptionsAPIInDTO,
  CompletedOfferingChangePaginationOptionsAPIInDTO,
} from "./models/application-offering-change-request.institutions.dto";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

/**
 * Application offering change request controller for institutions client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location/:locationId/application-offering-change-request")
@ApiTags(
  `${ClientTypeBaseRoute.Institution}-location-application-offering-change-request`,
)
@HasLocationAccess("locationId")
export class ApplicationOfferingChangeRequestInstitutionsController extends BaseController {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {
    super();
  }

  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param pagination options to execute the pagination.
   * @returns list and count of eligible applications that can be requested for
   * application offering change.
   */
  @Get("available")
  async getEligibleApplications(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() pagination: OfferingChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
  > {
    const applications =
      await this.applicationOfferingChangeRequestService.getEligibleApplications(
        locationId,
        pagination,
      );
    return {
      results: applications.results.map((eachApplication) => {
        const offering = eachApplication.currentAssessment.offering;
        return {
          applicationNumber: eachApplication.applicationNumber,
          applicationId: eachApplication.id,
          studyStartDate: offering.studyStartDate,
          studyEndDate: offering.studyEndDate,
          fullName: getUserFullName(eachApplication.student.user),
        };
      }),
      count: applications.count,
    };
  }

  /**
   * Get all in progress application offering change requests.
   * @param locationId location id.
   * @param pagination options to execute the pagination.
   * @returns list and count of inprogress application offering change requests.
   */
  @Get("in-progress")
  async getInProgressApplications(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() pagination: InProgressOfferingChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<InProgressApplicationOfferingChangesAPIOutDTO>
  > {
    const offeringChange =
      await this.applicationOfferingChangeRequestService.getSummaryByStatus(
        locationId,
        pagination,
        [
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
        ],
      );
    return {
      results: offeringChange.results.map((eachOfferingChange) => {
        const offering =
          eachOfferingChange.application.currentAssessment.offering;
        return {
          applicationNumber: eachOfferingChange.application.applicationNumber,
          applicationId: eachOfferingChange.application.id,
          studyStartDate: offering.studyStartDate,
          studyEndDate: offering.studyEndDate,
          fullName: getUserFullName(
            eachOfferingChange.application.student.user,
          ),
          status: eachOfferingChange.applicationOfferingChangeRequestStatus,
        };
      }),
      count: offeringChange.count,
    };
  }

  /**
   * Get all completed (Approved/ Declined) application offering change requests.
   * @param locationId location id.
   * @param pagination options to execute the pagination.
   * @returns list and count of completed application offering change requests.
   */
  @Get("completed")
  async getCompletedApplications(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() pagination: CompletedOfferingChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<CompletedApplicationOfferingChangesAPIOutDTO>
  > {
    const offeringChange =
      await this.applicationOfferingChangeRequestService.getSummaryByStatus(
        locationId,
        pagination,
        [
          ApplicationOfferingChangeRequestStatus.Approved,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ],
      );
    return {
      results: offeringChange.results.map((eachOfferingChange) => {
        const offering =
          eachOfferingChange.application.currentAssessment.offering;
        return {
          applicationNumber: eachOfferingChange.application.applicationNumber,
          applicationId: eachOfferingChange.application.id,
          studyStartDate: offering.studyStartDate,
          studyEndDate: offering.studyEndDate,
          fullName: getUserFullName(
            eachOfferingChange.application.student.user,
          ),
          status: eachOfferingChange.applicationOfferingChangeRequestStatus,
          dateCompleted:
            eachOfferingChange.assessedDate ??
            eachOfferingChange.studentActionDate,
        };
      }),
      count: offeringChange.count,
    };
  }
}
