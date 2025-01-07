import {
  Controller,
  DefaultValuePipe,
  Get,
  NotFoundException,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Post,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import {
  ApplicationAssessmentStatusDetailsAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
  ApplicationVersionAPIOutDTO,
} from "./models/application.dto";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { MSFAANumberSharedService } from "@sims/services";
import { CustomNamedError, getPSTPDTDateHourMinute } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { IUserToken, Role } from "../../auth";
import { ApplicationStatus } from "@sims/sims-db";
import { application } from "express";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application`)
export class ApplicationAESTController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by ministry users.
   * @param applicationId
   * @returns Application details
   */
  @Get(":applicationId")
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplication(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Query("loadDynamicData", new DefaultValuePipe(true), ParseBoolPipe)
    loadDynamicData: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      { loadDynamicData, allowOverwritten: true },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    if (loadDynamicData) {
      application.data =
        await this.applicationControllerService.generateApplicationFormData(
          application.data,
        );
    }

    return this.applicationControllerService.transformToApplicationDTO(
      application,
    );
  }

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param applicationId reference application id.
   * @returns the newly created MSFAA.
   */
  @Roles(Role.StudentReissueMSFAA)
  @Post(":applicationId/reissue-msfaa")
  @ApiNotFoundResponse({ description: "Application id not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "Not possible to create an MSFAA due to an invalid application status, or " +
      "not possible to reissue an MSFAA when there is no pending disbursements for the application, or " +
      "not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
  })
  async reissueMSFAA(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const newMSFAANumber = await this.msfaaNumberSharedService.reissueMSFAA(
        applicationId,
        userToken.userId,
      );
      return { id: newMSFAANumber.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Gets application and assessment status details.
   * @param applicationId application id.
   * @returns application and assessment status details.
   */
  @Get(":applicationId/assessment-details")
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplicationAssessmentStatusDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationAssessmentStatusDetailsAPIOutDTO> {
    const application =
      await this.applicationService.getApplicationAssessmentStatusDetails(
        applicationId,
      );
    if (!application) {
      throw new NotFoundException("Application not found.");
    }
    const [originalAssessment] = application.studentAssessments;
    return {
      applicationId: application.id,
      originalAssessmentStatus: originalAssessment.studentAssessmentStatus,
      isApplicationArchived: application.isArchived,
      applicationStatus: application.applicationStatus,
    };
  }

  /**
   * Get details for an application at 'InProgress' status.
   * @param applicationId application id.
   * @returns application details.
   */
  @Get(":applicationId/in-progress")
  @ApiNotFoundResponse({
    description: "Application id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: `Application not in ${ApplicationStatus.InProgress} status.`,
  })
  async getInProgressApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getInProgressApplicationDetails(
      applicationId,
    );
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId application id.
   * @returns application progress details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get(":applicationId/progress-details")
  async getApplicationProgressDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return this.applicationControllerService.getApplicationProgressDetails(
      applicationId,
    );
  }

  /**
   * Get details for an application at 'Enrolment' status.
   * @param applicationId student application id.
   * @returns details for the application enrolment status.
   */
  @ApiNotFoundResponse({
    description:
      "Application not found or not in relevant status to get enrolment details.",
  })
  @Get(":applicationId/enrolment")
  async getEnrolmentApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getEnrolmentApplicationDetails(
      applicationId,
    );
  }

  /**
   * Get details for an application at 'Completed' status.
   * @param applicationId application id.
   * @returns details for an application on at completed status.
   */
  @ApiNotFoundResponse({
    description: `Application not found or not on ${ApplicationStatus.Completed} status.`,
  })
  @Get(":applicationId/completed")
  async getCompletedApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getCompletedApplicationDetails(
      applicationId,
    );
  }

  /**
   * Get history of application versions for an application
   * where the current application is excluded.
   * @param applicationId application Id.
   * @returns history of application versions.
   */
  @ApiNotFoundResponse({
    description: `Application not found or not on ${ApplicationStatus.Completed} status.`,
  })
  @Get(":applicationId/versions")
  async getApplicationVersionHistory(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationVersionAPIOutDTO[]> {
    const applications =
      await this.applicationService.applicationVersionHistory(applicationId);
    if (!application) {
      throw new NotFoundException("Application not found.");
    }
    return applications.map((application) => ({
      id: application.id,
      submittedDate: getPSTPDTDateHourMinute(application.submittedDate),
    }));
  }
}
