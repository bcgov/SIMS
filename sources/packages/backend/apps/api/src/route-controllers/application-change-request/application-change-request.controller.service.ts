import { Injectable } from "@nestjs/common";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import {
  PaginatedResultsAPIOutDTO,
  StudentAppealPendingPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./models/application-change-request.dto";

@Injectable()
export class ApplicationChangeRequestControllerService {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
  ) {}

  /**
   * Gets all new application change requests for 2025-2026 program year and later.
   * @param pagination options to execute the pagination.
   * @returns list of new application change requests for 2025-2026 and later.
   */
  async getNewApplicationChangeRequests(
    pagination: StudentAppealPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    // Filter for 2025-2026 and later change requests
    const applicationChangeRequests =
      await this.applicationOfferingChangeRequestService.getSummaryByStatus(
        [ApplicationOfferingChangeRequestStatus.InProgressWithSABC],
        pagination,
        {
          useApplicationSort: true,
          programYearFilter: {
            startYear: 2025, // Filter for 2025-2026 and later
          },
        },
      );

    return {
      results: applicationChangeRequests.results.map((eachRequest) => ({
        requestId: eachRequest.id,
        applicationId: eachRequest.application.id,
        studentId: eachRequest.application.student.id,
        applicationNumber: eachRequest.application.applicationNumber,
        submittedDate: eachRequest.createdAt,
        firstName: eachRequest.application.student.user.firstName,
        lastName: eachRequest.application.student.user.lastName,
        programYearId: eachRequest.application.programYear?.id, // Include program year ID
      })),
      count: applicationChangeRequests.count,
    };
  }
}
