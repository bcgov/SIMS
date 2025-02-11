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
  ApplicationOverallDetailsAPIOutDTO,
  ApplicationFormData,
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
import { CustomNamedError } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { IUserToken, Role } from "../../auth";
import { ApplicationStatus } from "@sims/sims-db";

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
    @Query("loadCurrentApplication", new DefaultValuePipe(true), ParseBoolPipe)
    loadCurrentApplication: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    let currentApplicationId: number;
    if (loadCurrentApplication) {
      currentApplicationId =
        await this.applicationService.getCurrentApplicationFromApplicationId(
          applicationId,
        );
    }
    const application = await this.applicationService.getApplicationById(
      currentApplicationId,
      {
        loadDynamicData,
        loadPrecedingApplication: true,
        allowOverwritten: true,
      },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }
    let currentReadOnlyData: ApplicationFormData;
    let previousReadOnlyData: ApplicationFormData;
    if (loadDynamicData) {
      // Check if a previous application exists.
      const previousApplicationVersion =
        await this.applicationService.getLastApplicationVersion(
          application.precedingApplication.id,
        );
      const currentReadOnlyDataPromise =
        this.applicationControllerService.generateApplicationFormData(
          application.data,
        );
      // If there is a previous application, generate its read-only data.
      const previousReadOnlyDataPromise =
        previousApplicationVersion &&
        this.applicationControllerService.generateApplicationFormData(
          previousApplicationVersion.data,
        );
      // Wait for both promises to resolve.
      [currentReadOnlyData, previousReadOnlyData] = await Promise.all([
        currentReadOnlyDataPromise,
        previousReadOnlyDataPromise,
      ]);
      application.data = currentReadOnlyData;
    }
    return this.applicationControllerService.transformToApplicationDTO(
      application,
      { previousData: previousReadOnlyData },
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
   * Get application overall details for an application.
   * @param applicationId application Id.
   * @returns application overall details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get(":applicationId/overall-details")
  async getApplicationOverallDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationOverallDetailsAPIOutDTO> {
    const application = await this.applicationService.doesApplicationExist({
      applicationId,
    });
    if (!application) {
      throw new NotFoundException("Application not found.");
    }
    const applications =
      await this.applicationService.getPreviousApplicationVersions(
        applicationId,
      );
    return {
      previousVersions: applications.map((application) => ({
        id: application.id,
        submittedDate: application.submittedDate,
      })),
    };
  }
}
