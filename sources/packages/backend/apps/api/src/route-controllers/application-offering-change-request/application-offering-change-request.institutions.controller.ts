import {
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  HasLocationAccess,
  UserToken,
} from "../../auth/decorators";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { STUDY_DATE_OVERLAP_ERROR, getUserFullName } from "../../utilities";
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
} from "./models/application-offering-change-request.dto";
import {
  APPLICATION_NOT_FOUND,
  ApplicationOfferingChangeRequestService,
  ApplicationService,
} from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IInstitutionUserToken } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import {
  EDUCATION_PROGRAM_IS_EXPIRED,
  EDUCATION_PROGRAM_IS_NOT_ACTIVE,
  OFFERING_DOES_NOT_BELONG_TO_LOCATION,
  OFFERING_INTENSITY_MISMATCH,
  OFFERING_PROGRAM_YEAR_MISMATCH,
} from "../../constants";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { ApplicationOfferingChangeRequestControllerService } from "./application-offering-change-request.controller.service";

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
    private readonly applicationOfferingChangeRequestControllerService: ApplicationOfferingChangeRequestControllerService,
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly applicationService: ApplicationService,
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
   * @param applicationId application id.
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
    const offering = application.currentAssessment.offering;
    return {
      applicationNumber: application.applicationNumber,
      programId: offering.educationProgram.id,
      isProgramActive: offering.educationProgram.isActive,
      isProgramExpired: offering.educationProgram.isExpired,
      offeringId: offering.id,
      offeringIntensity: offering.offeringIntensity,
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
        [
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC,
          ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
        ],
        pagination,
        { locationId, useApplicationSort: true },
      );
    return {
      results: offeringChange.results.map((eachOfferingChange) => {
        const offering =
          eachOfferingChange.application.currentAssessment.offering;
        return {
          id: eachOfferingChange.id,
          applicationNumber: eachOfferingChange.application.applicationNumber,
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
        [
          ApplicationOfferingChangeRequestStatus.Approved,
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent,
          ApplicationOfferingChangeRequestStatus.DeclinedBySABC,
        ],
        pagination,
        { locationId, useApplicationSort: true },
      );
    return {
      results: offeringChange.results.map((eachOfferingChange) => {
        const offering =
          eachOfferingChange.application.currentAssessment.offering;
        return {
          id: eachOfferingChange.id,
          applicationNumber: eachOfferingChange.application.applicationNumber,
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
  async getApplicationOfferingChangeRequest(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @Param("locationId", ParseIntPipe) locationId: number,
  ): Promise<ApplicationOfferingChangesAPIOutDTO> {
    return this.applicationOfferingChangeRequestControllerService.getApplicationOfferingChangeRequest(
      applicationOfferingChangeRequestId,
      { locationId },
    );
  }

  /**
   * Creates a new application offering change request.
   * @param locationId location id.
   * @param payload information to create the new request.
   * @returns newly change request id created.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Study period overlap or offering program year mismatch or offering intensity mismatch.",
  })
  @ApiUnauthorizedResponse({
    description: "The location does not have access to the offering.",
  })
  @Post()
  async createApplicationOfferingChangeRequest(
    @UserToken() userToken: IInstitutionUserToken,
    @Param("locationId", ParseIntPipe) locationId: number,
    @Body() payload: CreateApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      await this.applicationService.validateApplicationOffering(
        payload.applicationId,
        payload.offeringId,
        locationId,
      );
      const applicationOfferingChangeRequest =
        await this.applicationOfferingChangeRequestService.createRequest(
          locationId,
          payload.applicationId,
          payload.offeringId,
          payload.reason,
          userToken.userId,
        );
      return { id: applicationOfferingChangeRequest.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case STUDY_DATE_OVERLAP_ERROR:
          case OFFERING_INTENSITY_MISMATCH:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
          case OFFERING_PROGRAM_YEAR_MISMATCH:
          case EDUCATION_PROGRAM_IS_NOT_ACTIVE:
          case EDUCATION_PROGRAM_IS_EXPIRED:
            throw new UnprocessableEntityException(error.message);
          case OFFERING_DOES_NOT_BELONG_TO_LOCATION:
            throw new UnauthorizedException(error.message);
        }
      }
      this.logger.error(
        `Error while submitting an application offering change request: ${error}`,
      );
      throw new InternalServerErrorException(
        "Error while submitting an application offering change request",
      );
    }
  }
  @InjectLogger()
  logger: LoggerService;
}
