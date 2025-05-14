import { Injectable } from "@nestjs/common";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import {
  PaginatedResultsAPIOutDTO,
  StudentChangeRequestPendingPaginationOptionsAPIInDTO,
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
    pagination: StudentChangeRequestPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    // 'submittedDate' in the API corresponds to 'createdAt' in the database
    const updatedPagination = {
      ...pagination,
      sortField:
        pagination.sortField === "submittedDate"
          ? "createdAt"
          : pagination.sortField,
    };

    const applicationChangeRequests =
      await this.applicationOfferingChangeRequestService.getSummaryByStatus(
        [ApplicationOfferingChangeRequestStatus.InProgressWithSABC],
        updatedPagination,
        {
          useApplicationSort: false, // Use false for sorting by createdAt/status
        },
      );

    // Filter for 2025-2026 and later program years (programYear.startYear >= 2025)
    const filteredResults = applicationChangeRequests.results
      .filter((eachRequest) => {
        if (!eachRequest.application.programYear) {
          return false;
        }
        const startDate = eachRequest.application.programYear.startDate;
        if (!startDate) {
          return false;
        }
        const startYear = parseInt(startDate.substring(0, 4), 10);
        return startYear >= 2025;
      })
      .map((eachRequest) => ({
        requestId: eachRequest.id,
        applicationId: eachRequest.application.id,
        studentId: eachRequest.application.student.id,
        applicationNumber: eachRequest.application.applicationNumber,
        submittedDate: eachRequest.createdAt,
        firstName: eachRequest.application.student.user.firstName,
        lastName: eachRequest.application.student.user.lastName,
        programYearId: eachRequest.application.programYear?.id, // Include program year ID
      }));

    return {
      results: filteredResults,
      count: filteredResults.length,
    };
  }
}
