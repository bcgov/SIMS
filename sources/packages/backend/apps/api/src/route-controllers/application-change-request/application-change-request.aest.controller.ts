import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
} from "@nestjs/common";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import { ApplicationEditStatus } from "@sims/sims-db";
import { ApplicationChangeRequestService } from "../../services";
import { ApplicationChangeRequestAPIInDTO } from "./models/application-change-request.dto";
import BaseController from "../BaseController";
import { Role } from "../../auth";

/**
 * Controller for application change request operations for the Ministry.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-change-request")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-change-request`)
export class ApplicationChangeRequestAESTController extends BaseController {
  constructor(
    private readonly applicationChangeRequestService: ApplicationChangeRequestService,
  ) {
    super();
  }

  /**
   * Approves or declines an application change request.
   * @param applicationId application id.
   * @param payload request payload.
   * @param user current authenticated user.
   */
  @Roles(Role.StudentApproveDeclineAppeals)
  @Patch(":applicationId")
  @ApiNotFoundResponse({
    description:
      "Application to assess change not found or not in valid status to be approved/declined.",
  })
  async assessApplicationChangeRequest(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: ApplicationChangeRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const applicationChangeRequest =
      await this.applicationChangeRequestService.applicationChangeRequestExists(
        applicationId,
        {
          studentId: payload.studentId,
          applicationChangeRequestStatus:
            ApplicationEditStatus.ChangePendingApproval,
        },
      );
    if (!applicationChangeRequest) {
      throw new NotFoundException(
        "Application to assess change not found or not in valid status to be approved/declined.",
      );
    }
    await this.applicationChangeRequestService.updateApplicationChangeRequestStatus(
      applicationId,
      payload.studentId,
      payload.applicationChangeRequestStatus,
      payload.note,
      userToken.userId,
    );
  }
}
