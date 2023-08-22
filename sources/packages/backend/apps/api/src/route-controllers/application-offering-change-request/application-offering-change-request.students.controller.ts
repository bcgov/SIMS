import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnauthorizedException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  ApplicationOfferingChangesAPIOutDTO,
  UpdateApplicationOfferingChangeRequestAPIInDTO,
} from "./models/application-offering-change-request.dto";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";
import { StudentUserToken } from "../../auth";
import { ApplicationOfferingChangeRequestControllerService } from "./application-offering-change-request.controller.service";
import { ApplicationOfferingChangeRequestService } from "../../services";

/**
 * Application offering change request controller for students client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller(
  "application-offering-change-request/:applicationOfferingChangeRequestId",
)
@ApiTags(`${ClientTypeBaseRoute.Student}-application-offering-change-request`)
export class ApplicationOfferingChangeRequestStudentsController extends BaseController {
  constructor(
    private readonly applicationOfferingChangeRequestService: ApplicationOfferingChangeRequestService,
    private readonly applicationOfferingChangeRequestControllerService: ApplicationOfferingChangeRequestControllerService,
  ) {
    super();
  }

  /**
   * Gets the Application Offering Change Request details.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param studentUserToken student user token to authorize the user.
   * @returns Application Offering Change Request details.
   */
  @Get()
  @ApiNotFoundResponse({
    description: "Not able to find an Application Offering Change Request.",
  })
  async getById(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    studentUserToken: StudentUserToken,
  ): Promise<ApplicationOfferingChangesAPIOutDTO> {
    return this.applicationOfferingChangeRequestControllerService.getById(
      applicationOfferingChangeRequestId,
      { studentId: studentUserToken.studentId },
    );
  }

  /**
   * Gets the Application Offering Change Request status.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param studentUserToken student user token to authorize the user.
   * @returns Application Offering Change Request status.
   */
  @Get("application-offering-change-request-status")
  @ApiNotFoundResponse({
    description:
      "Not able to get the Application Offering Change Request Status.",
  })
  async getApplicationOfferingChangeRequestStatusById(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    studentUserToken: StudentUserToken,
  ): Promise<ApplicationOfferingChangeRequestStatus> {
    const applicationOfferingChangeRequestStatus =
      await this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequestStatusById(
        applicationOfferingChangeRequestId,
        {
          studentId: studentUserToken.studentId,
        },
      );
    if (!applicationOfferingChangeRequestStatus) {
      throw new NotFoundException(
        "Not able to get the Application Offering Change Request Status.",
      );
    }
    return applicationOfferingChangeRequestStatus;
  }

  /**
   * Updates an application offering change request status.
   * @param applicationOfferingChangeRequestId application offering change request id.
   * @param userToken user token to authorize the user.
   * @param payload information to update the application offering change request status.
   */
  @Patch()
  @ApiUnauthorizedResponse({
    description:
      "The student does not have access to the application offering change request.",
  })
  async updateApplicationOfferingChangeRequestStatus(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    userToken: StudentUserToken,
    @Body()
    payload: UpdateApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<void> {
    const studentAuthorized =
      await this.applicationOfferingChangeRequestService.validateStudentForOfferingChangeRequest(
        applicationOfferingChangeRequestId,
        userToken.studentId,
      );
    if (!studentAuthorized) {
      throw new UnauthorizedException(
        "Student is not authorized for the provided offering.",
      );
    }
    await this.applicationOfferingChangeRequestService.updateApplicationOfferingChangeRequestStatus(
      applicationOfferingChangeRequestId,
      payload.applicationOfferingChangeRequestStatus,
      {
        studentConsent: payload?.studentConsent,
      },
    );
  }
}
