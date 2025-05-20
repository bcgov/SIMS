import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
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
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { IUserToken } from "../../auth/userToken.interface";
import {
  APPLICATION_NOT_FOUND,
  ApplicationChangeRequestService,
} from "../../services";
import {
  ApplicationChangeRequestAPIInDTO,
  ApplicationChangeRequestPendingSummaryAPIOutDTO,
} from "./models/application-change-request.dto";
import BaseController from "../BaseController";
import { Role } from "../../auth";
import { INVALID_APPLICATION_EDIT_STATUS } from "@sims/services/constants";
import { CustomNamedError } from "@sims/utilities";
import {
  ApplicationChangeRequestPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";

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
    description: "Application to assess change not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Application to assess change not in valid status to be updated.",
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
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        if (error.name === APPLICATION_NOT_FOUND) {
          throw new NotFoundException(error.message);
        }
        if (error.name === INVALID_APPLICATION_EDIT_STATUS) {
          throw new UnprocessableEntityException(
            new ApiProcessError(error.message, INVALID_APPLICATION_EDIT_STATUS),
          );
        }
      }
      throw error;
    }
  }

  /**
   * Gets all pending application change requests (applications in 'Change pending approval' status).
   * @param pagination options to execute the pagination.
   * @returns list of application change requests.
   */
  @Get("pending")
  async getApplicationChangeRequests(
    @Query() pagination: ApplicationChangeRequestPaginationOptionsAPIInDTO,
  ): Promise<
    PaginatedResultsAPIOutDTO<ApplicationChangeRequestPendingSummaryAPIOutDTO>
  > {
    return this.applicationChangeRequestService.getApplicationChangeRequests(
      pagination,
    );
  }
}
