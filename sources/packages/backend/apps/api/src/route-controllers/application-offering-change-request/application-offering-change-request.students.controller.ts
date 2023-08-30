import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnauthorizedException,
  UnprocessableEntityException,
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
        "Not able to get the Application Offering Change Request Status.",
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
    payload: StudentApplicationOfferingChangeRequestAPIInDTO,
  ): Promise<void> {
    const student = await this.applicationOfferingChangeRequestService.getById(
      applicationOfferingChangeRequestId,
      { studentId: userToken.studentId },
    );
    if (!student) {
      throw new UnauthorizedException(
        "Student is not authorized for the provided offering.",
      );
    }
    if (
      !payload.studentConsent &&
      payload.applicationOfferingChangeRequestStatus ===
        ApplicationOfferingChangeRequestStatus.InProgressWithSABC
    ) {
      throw new UnprocessableEntityException(
        "Student consent is required to update the application offering change request status.",
      );
    }
    await this.applicationOfferingChangeRequestService.updateApplicationOfferingChangeRequestStatus(
      applicationOfferingChangeRequestId,
      payload.applicationOfferingChangeRequestStatus,
      payload.studentConsent,
    );
  }
}
