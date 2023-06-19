import { Controller, Get, Param, ParseIntPipe, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, HasLocationAccess } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { getUserFullName } from "../../utilities";
import {
  OfferinfChangePaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import BaseController from "../BaseController";
import { ApplicationOfferingChangeSummaryAPIOutDTO } from "./models/application-offering-change-request.institutions.dto";
import { ApplicationOfferingChangeRequestService } from "../../services";

/**
 * Application offering change request controller for institutions client.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("location/:locationId/application-offering-change-request")
@ApiTags(`${ClientTypeBaseRoute.Institution}-location-application-offering-change-request`)
export class ApplicationOfferingChangeRequestInstitutionsController extends BaseController {
  constructor(private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService) {
    super();
  }

  /**
   * Gets all eligible applications that can be requested for application
   * offering change.
   * @param locationId location id.
   * @param paginationOptions options to execute the pagination.
   * @returns list of eligible applications that can be requested for
   * application offering change.
   */
  @HasLocationAccess("locationId")
  @Get("available")
  async getEligibleApplicationOfferingChangeRecords(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Query() pagination: OfferinfChangePaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationOfferingChangeSummaryAPIOutDTO>
  > {
    const applications =
      await this.applicationOfferingChangeRequestService.getEligibleApplicationOfferingChangeRecords(
        locationId,
        pagination,
      );

    return {
      results: applications.results.map((eachApplication) => {
        const offering = eachApplication.currentAssessment?.offering;
        return {
          applicationNumber: eachApplication.applicationNumber,
          applicationId: eachApplication.id,
          studyStartPeriod: offering?.studyStartDate,
          studyEndPeriod: offering?.studyEndDate,
          fullName: getUserFullName(eachApplication.student.user),
        };
      }),
      count: applications.count,
    };
  }
}
