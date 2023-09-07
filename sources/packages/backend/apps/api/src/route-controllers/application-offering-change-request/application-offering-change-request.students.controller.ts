import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  ApplicationOfferingChangeRequestStatusAPIOutDTO,
  ApplicationOfferingDetailsAPIOutDTO,
  StudentApplicationOfferingChangeRequestAPIInDTO,
} from "./models/application-offering-change-request.dto";
import { StudentUserToken } from "../../auth";
import { ApplicationOfferingChangeRequestControllerService } from "./application-offering-change-request.controller.service";
import { ApplicationOfferingChangeRequestService } from "../../services";
import { ApplicationOfferingChangeRequestStatus } from "@sims/sims-db";

/**
 * Application offering change request controller for students client.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@Controller("application-offering-change-request")
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
  @Get(":applicationOfferingChangeRequestId")
  @ApiNotFoundResponse({
    description: "Not able to find an Application Offering Change Request.",
  })
  async getApplicationOfferingChangeRequest(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    studentUserToken: StudentUserToken,
  ): Promise<ApplicationOfferingDetailsAPIOutDTO> {
    return this.applicationOfferingChangeRequestControllerService.getApplicationOfferingChangeRequest(
      applicationOfferingChangeRequestId,
      {
        studentId: studentUserToken.studentId,
        applicationOfferingDetails: true,
      },
    );
  }

  /**
   * Gets the Application Offering Change Request status.
   * @param applicationOfferingChangeRequestId the Application Offering Change Request id.
   * @param studentUserToken student user token to authorize the user.
   * @returns Application Offering Change Request status.
   */
  @Get(
    ":applicationOfferingChangeRequestId/application-offering-change-request-status",
  )
  @ApiNotFoundResponse({
    description:
      "Not able to get the Application Offering Change Request Status.",
  })
  async getApplicationOfferingChangeRequestStatus(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    studentUserToken: StudentUserToken,
  ): Promise<ApplicationOfferingChangeRequestStatusAPIOutDTO> {
    const applicationOfferingChangeRequestStatus =
      await this.applicationOfferingChangeRequestService.getApplicationOfferingChangeRequestStatusById(
        applicationOfferingChangeRequestId,
        {
          studentId: studentUserToken.studentId,
        },
      );
    if (!applicationOfferingChangeRequestStatus) {
      throw new NotFoundException(
        "Application Offering Change Request not found.",
      );
    }
    return { status: applicationOfferingChangeRequestStatus };
  }

  /**
   * Updates an application offering change request status.
   * @param applicationOfferingChangeRequestId application offering change request id.
   * @param userToken user token to authorize the user.
   * @param payload information to update the application offering change request status.
   */
  @Patch(":applicationOfferingChangeRequestId")
  @ApiNotFoundResponse({
    description:
      "Application offering change not found or not in valid status to be updated.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Invalid application offering change status or student consent not provided",
  })
  async updateApplicationOfferingChangeRequest(
    @Param("applicationOfferingChangeRequestId", ParseIntPipe)
    applicationOfferingChangeRequestId: number,
    @UserToken()
    userToken: StudentUserToken,
    @Body()
    payload: StudentApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<void> {
    const applicationOfferingChangeRequest =
      await this.applicationOfferingChangeRequestService.applicationOfferingChangeRequestExists(
        applicationOfferingChangeRequestId,
        {
          applicationOfferingChangeRequestStatus:
            ApplicationOfferingChangeRequestStatus.InProgressWithStudent,
          studentId: userToken.studentId,
        },
      );
    if (!applicationOfferingChangeRequest) {
      throw new NotFoundException(
        "Application offering change not found or not in valid status to be updated.",
      );
    }
    if (
      !(
        payload.applicationOfferingChangeRequestStatus ===
          ApplicationOfferingChangeRequestStatus.InProgressWithSABC ||
        payload.applicationOfferingChangeRequestStatus ===
          ApplicationOfferingChangeRequestStatus.DeclinedByStudent
      )
    ) {
      throw new UnprocessableEntityException(
        "Invalid application offering change request status.",
      );
    }
    if (
      payload.applicationOfferingChangeRequestStatus ===
        ApplicationOfferingChangeRequestStatus.InProgressWithSABC &&
      !payload.studentConsent
    ) {
      throw new UnprocessableEntityException(
        "Student consent is required to update the application offering change request status.",
      );
    }
    await this.applicationOfferingChangeRequestService.updateApplicationOfferingChangeRequest(
      applicationOfferingChangeRequestId,
      payload.applicationOfferingChangeRequestStatus,
      payload.studentConsent,
    );
  }
}
