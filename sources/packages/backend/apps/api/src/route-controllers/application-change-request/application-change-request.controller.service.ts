import { Injectable, Inject } from "@nestjs/common";
import {
  PaginatedResultsAPIOutDTO,
  StudentChangeRequestPendingPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./models/application-change-request.dto";
import { Application, ApplicationEditStatus } from "@sims/sims-db";
import { ApplicationChangeRequestService as AppChangeRequestDBService } from "../../services/application-change-request/application-change-request.service";

@Injectable()
export class ApplicationChangeRequestControllerService {
  constructor(
    @Inject(AppChangeRequestDBService)
    private readonly appChangeRequestDBService: AppChangeRequestDBService,
  ) {}

  /**
   * Gets all applications with edit status 'Change pending approval'.
   * @param pagination options to execute the pagination.
   * @returns list of applications matching the criteria.
   */
  async getNewApplicationChangeRequests(
    pagination: StudentChangeRequestPendingPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    const updatedPagination = {
      ...pagination,
    };

    const targetApplicationEditStatus =
      ApplicationEditStatus.ChangePendingApproval;

    const applicationsPaginatedResult =
      await this.appChangeRequestDBService.getApplicationsForChangeRequestList(
        targetApplicationEditStatus,
        updatedPagination,
      );

    const mappedResults = applicationsPaginatedResult.results.map(
      (app: Application) => ({
        applicationId: app.id,
        parentApplicationId: app.parentApplication.id,
        studentId: app.student.id,
        submittedDate: app.createdAt,
        firstName: app.student.user.firstName,
        lastName: app.student.user.lastName,
        applicationNumber: app.applicationNumber,
      }),
    );

    return {
      results: mappedResults,
      count: applicationsPaginatedResult.count,
    };
  }
}
