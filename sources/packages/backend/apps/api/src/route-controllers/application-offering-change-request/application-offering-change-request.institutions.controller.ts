import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
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
  ApplicationOfferingChangesAPIOutDTO,
  ApplicationOfferingChangeSummaryDetailAPIOutDTO,
  CreateApplicationOfferingChangeRequestAPIInDTO,
} from "./models/application-offering-change-request.institutions.dto";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IInstitutionUserToken } from "../../auth";

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
        { pagination },
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
   * Gets an eligible application that can be requested for application
   * offering change.
   * @param locationId location id.
   * @returns eligible application.
   */
  @ApiNotFoundResponse({
    description: "Application not found or it is not eligible.",
  })
  @Get("available/application/:applicationId")
  async getEligibleApplication(
    @Param("locationId", ParseIntPipe) locationId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationOfferingChangeSummaryDetailAPIOutDTO> {
    const application =
      await this.applicationOfferingChangeRequestService.getEligibleApplications(
        locationId,
        { applicationId },
      );
    if (!application) {
      throw new NotFoundException(
        "Application not found or it is not eligible.",
      );
    }
    return {
      applicationNumber: application.applicationNumber,
      applicationId: application.id,
      programId: application.currentAssessment.offering.educationProgram.id,
      offeringId: application.currentAssessment.offering.id,
      offeringIntensity:
        application.currentAssessment.offering.offeringIntensity,
      programYearId: application.programYear.id,
      fullName: getUserFullName(application.student.user),
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
          id: eachOfferingChange.id,
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
          id: eachOfferingChange.id,
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

  /**
   * Gets the Application Offering Change Request details.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param locationId location id.
   * @returns Application Offering Change Request details.
   */
  @Get(":applicationOfferingChangeRequestId")
  @ApiNotFoundResponse({
    description: "Not able to find an Application Offering Change Request.",
  })
  async getById(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<ApplicationOfferingChangesAPIOutDTO> {
    const request = await this.applicationOfferingChangeRequestService.getById(
      applicationOfferingChangeRequestId,
      { locationId },
    );
    if (!request) {
      throw new NotFoundException(
        "Not able to find an Application Offering Change Request.",
      );
    }
    return {
      id: request.id,
      status: request.applicationOfferingChangeRequestStatus,
      applicationId: request.application.id,
      applicationNumber: request.application.applicationNumber,
      locationName: request.application.location.name,
      activeOfferingId: request.activeOffering.id,
      requestedOfferingId: request.requestedOffering.id,
      requestedOfferingDescription: request.requestedOffering.name,
      requestedOfferingProgramId: request.requestedOffering.educationProgram.id,
      requestedOfferingProgramName:
        request.requestedOffering.educationProgram.name,
      reason: request.reason,
      assessedNoteDescription: request.assessedNote?.description,
      studentFullName: getUserFullName(request.application.student.user),
    };
  }

  /**
   * Creates a new application offering change request.
   * @param locationId location id.
   * @param payload information to create the new request.
   * @returns newly change request id created.
   */
  @Post()
  async createApplicationOfferingChangeRequest(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Body() payload: CreateApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    // TODO: Apply the same validations from PIR.
    const newRequest =
      await this.applicationOfferingChangeRequestService.createRequest(
        locationId,
        payload.applicationId,
        payload.offeringId,
        payload.reason,
        userToken.userId,
      );
    return { id: newRequest.id };
  }
}
