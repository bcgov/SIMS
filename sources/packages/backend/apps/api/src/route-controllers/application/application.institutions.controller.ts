import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Query,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import {
  ApplicationOverallDetailsAPIOutDTO,
  ApplicationProgressDetailsAPIOutDTO,
  ApplicationSupplementalDataAPIOutDTO,
  CompletedApplicationDetailsAPIOutDTO,
  EnrolmentApplicationDetailsAPIOutDTO,
  InProgressApplicationDetailsAPIOutDTO,
} from "./models/application.dto";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";
import { AuthorizedParties } from "../../auth";
import { ApplicationStatus } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.institution)
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId", "applicationId")
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.Institution}-application`)
export class ApplicationInstitutionsController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by institution users.
   * @param applicationId for the application.
   * @param studentId for the student.
   * @returns Application details.
   */
  @ApiNotFoundResponse({
    description: `Current application for provided parent application not found.`,
  })
  @ApiUnprocessableEntityResponse({
    description: "Dynamic form configuration not found.",
  })
  @Get("student/:studentId/application/:applicationId")
  async getApplication(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
    @Query("loadDynamicData", new DefaultValuePipe(true), ParseBoolPipe)
    loadDynamicData: boolean,
  ): Promise<ApplicationSupplementalDataAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      {
        loadDynamicData,
        studentId: studentId,
      },
    );
    if (loadDynamicData) {
      application.data =
        await this.applicationControllerService.generateApplicationFormData(
          application.data,
          application,
        );
    }
    return this.applicationControllerService.transformToApplicationDTO(
      application,
    );
  }

  /**
   * Get details for an application at 'InProgress' status.
   * @param applicationId application id.
   * @param studentId student id.
   * @returns application details.
   */
  @Get("student/:studentId/application/:applicationId/in-progress")
  @ApiNotFoundResponse({
    description: "Application id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: `Application not in ${ApplicationStatus.InProgress} status.`,
  })
  async getInProgressApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<InProgressApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getInProgressApplicationDetails(
      applicationId,
      { studentId },
    );
  }

  /**
   * Get status of all requests and confirmations in student application (Exception, PIR and COE).
   * @param applicationId application id.
   * @param studentId student id.
   * @returns application progress details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get("student/:studentId/application/:applicationId/progress-details")
  async getApplicationProgressDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<ApplicationProgressDetailsAPIOutDTO> {
    return this.applicationControllerService.getApplicationProgressDetails(
      applicationId,
      { studentId },
    );
  }

  /**
   * Get details for an application at 'Enrolment' status.
   * @param applicationId student application id.
   * @param studentId student id.
   * @returns details for the application enrolment status.
   */
  @ApiNotFoundResponse({
    description:
      "Application not found or not in relevant status to get enrolment details.",
  })
  @Get("student/:studentId/application/:applicationId/enrolment")
  async getEnrolmentApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<EnrolmentApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getEnrolmentApplicationDetails(
      applicationId,
      { studentId },
    );
  }

  /**
   * Get details for an application at 'Completed' status.
   * @param applicationId application id.
   * @param studentId student id.
   * @returns details for an application on at completed status.
   */
  @ApiNotFoundResponse({
    description: `Application not found or not on ${ApplicationStatus.Completed} status.`,
  })
  @Get("student/:studentId/application/:applicationId/completed")
  async getCompletedApplicationDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<CompletedApplicationDetailsAPIOutDTO> {
    return this.applicationControllerService.getCompletedApplicationDetails(
      applicationId,
      { studentId },
    );
  }

  /**
   * Get application overall details for the given application.
   * @param applicationId application Id.
   * @param studentId student id.
   * @returns application overall details.
   */
  @ApiNotFoundResponse({
    description: "Application not found.",
  })
  @Get("student/:studentId/application/:applicationId/overall-details")
  async getApplicationOverallDetails(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<ApplicationOverallDetailsAPIOutDTO> {
    return await this.applicationControllerService.getApplicationOverallDetails(
      applicationId,
      { studentId, includeChangeRequest: false },
    );
  }
}
