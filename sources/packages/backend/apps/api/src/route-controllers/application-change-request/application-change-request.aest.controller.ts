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
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import {
  APPLICATION_NOT_FOUND,
  ApplicationChangeRequestService,
} from "../../services";
import { ApplicationChangeRequestAPIInDTO } from "./models/application-change-request.dto";
import BaseController from "../BaseController";
import { Role } from "../../auth";
import { INVALID_APPLICATION_EDIT_STATUS } from "@sims/services/constants";

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
   */
  @Roles(Role.StudentApproveDeclineAppeals)
  @Patch(":applicationId")
  @ApiNotFoundResponse({
    description:
      "Application to assess change not found or " +
      "application to assess change not in valid status to be updated.",
  })
  async assessApplicationChangeRequest(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Body() payload: ApplicationChangeRequestAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.applicationChangeRequestService.updateApplicationChangeRequestStatus(
        applicationId,
        payload.applicationEditStatus,
        payload.note,
        userToken.userId,
      );
    } catch (error) {
      if (error.name === APPLICATION_NOT_FOUND) {
        throw new NotFoundException(error);
      }
      throw new NotFoundException(
        new ApiProcessError(
          `Application ${applicationId} to assess change not in valid status to be updated.`,
          INVALID_APPLICATION_EDIT_STATUS,
        ),
      );
    }
  }
}
