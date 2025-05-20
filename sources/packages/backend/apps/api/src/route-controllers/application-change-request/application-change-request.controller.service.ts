import { Injectable, Inject } from "@nestjs/common";
import {
  PaginatedResultsAPIOutDTO,
  ApplicationChangeRequestPaginationOptionsAPIInDTO,
} from "../models/pagination.dto";
import { ApplicationChangeRequestPendingSummaryAPIOutDTO } from "./models/application-change-request.dto";
import { Application, ApplicationEditStatus } from "@sims/sims-db";
import { ApplicationChangeRequestService } from "../../services/application-change-request/application-change-request.service";

@Injectable()
export class ApplicationChangeRequestControllerService {
  constructor(
    @Inject(ApplicationChangeRequestService)
    private readonly appChangeRequestDBService: ApplicationChangeRequestService,
  ) {}

  /**
   * Gets all applications with edit status 'Change pending approval'.
   * @param pagination options to execute the pagination.
   * @returns list of applications matching the criteria.
   */
  async getApplicationChangeRequests(
    pagination: ApplicationChangeRequestPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    const applicationsPaginatedResult =
      await this.appChangeRequestDBService.getApplicationsByEditStatus(
        ApplicationEditStatus.ChangePendingApproval,
        pagination,
      );

    const mappedResults = applicationsPaginatedResult.results.map(
      (app: Application) => ({
        applicationId: app.id,
        precedingApplicationId: app.precedingApplication.id,
        studentId: app.student.id,
        submittedDate: app.submittedDate,
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
