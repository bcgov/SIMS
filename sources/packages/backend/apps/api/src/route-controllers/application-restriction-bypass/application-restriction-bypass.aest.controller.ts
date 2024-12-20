import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import BaseController from "../BaseController";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  ApplicationRestrictionBypassHistoryAPIOutDTO,
  AvailableStudentRestrictionsAPIOutDTO,
  BypassRestrictionAPIInDTO,
  RemoveBypassRestrictionAPIInDTO,
} from "./models/application-restriction-bypass.dto";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApplicationRestrictionBypassService } from "../../services";
import { ApplicationRestrictionBypass } from "@sims/sims-db";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IUserToken, Role } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import {
  ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
  APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
  APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
  STUDENT_RESTRICTION_IS_NOT_ACTIVE,
  STUDENT_RESTRICTION_NOT_FOUND,
} from "../../constants";
import { getUserFullName } from "../../utilities";

/**
 * Controller for AEST Application Restriction Bypasses.
 * This consists of all Rest APIs for ministry application restriction bypasses.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-restriction-bypass")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-restriction-bypass`)
export class ApplicationRestrictionBypassAESTController extends BaseController {
  constructor(
    private readonly applicationRestrictionBypassService: ApplicationRestrictionBypassService,
  ) {
    super();
  }

  /**
   * Get application restriction bypasses for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  @Get("application/:applicationId")
  async getApplicationRestrictionBypasses(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationRestrictionBypassHistoryAPIOutDTO> {
    const applicationRestrictionBypasses =
      await this.applicationRestrictionBypassService.getApplicationRestrictionBypasses(
        applicationId,
      );
    const bypasses = applicationRestrictionBypasses.map(
      (item: ApplicationRestrictionBypass) => ({
        id: item.id,
        restrictionCategory:
          item.studentRestriction.restriction.restrictionCategory,
        restrictionCode: item.studentRestriction.restriction.restrictionCode,
        isRestrictionActive: item.studentRestriction.isActive,
        isBypassActive: item.isActive,
      }),
    );

    return { bypasses };
  }

  /**
   * Gets application restriction bypass for a given application restriction bypass id.
   * @param id id of the application restriction bypass.
   * @returns application restriction bypass.
   */
  @ApiNotFoundResponse({
    description: "Application restriction bypass not found.",
  })
  @Get(":id")
  async getApplicationRestrictionBypass(
    @Param("id", ParseIntPipe) id: number,
  ): Promise<ApplicationRestrictionBypassAPIOutDTO> {
    const applicationRestrictionBypass =
      await this.applicationRestrictionBypassService.getApplicationRestrictionBypass(
        id,
      );
    if (!applicationRestrictionBypass) {
      throw new NotFoundException("Application restriction bypass not found.");
    }
    return {
      applicationRestrictionBypassId: applicationRestrictionBypass.id,
      studentRestrictionId: applicationRestrictionBypass.studentRestriction.id,
      restrictionCode:
        applicationRestrictionBypass.studentRestriction.restriction
          .restrictionCode,
      creationNote: applicationRestrictionBypass.creationNote.description,
      removalNote: applicationRestrictionBypass.removalNote?.description,
      createdBy: getUserFullName(applicationRestrictionBypass.bypassCreatedBy),
      createdDate: applicationRestrictionBypass.bypassCreatedDate.toISOString(),
      ...(applicationRestrictionBypass.bypassRemovedBy && {
        removedBy: getUserFullName(
          applicationRestrictionBypass.bypassRemovedBy,
        ),
      }),
      removedDate:
        applicationRestrictionBypass.bypassRemovedDate?.toISOString(),
      bypassBehavior: applicationRestrictionBypass.bypassBehavior,
    };
  }

  /**
   * Gets available student restrictions to bypass for a given application.
   * @param applicationId id of the application to retrieve restriction bypasses.
   * @returns application restriction bypasses.
   */
  @Get("application/:applicationId/options-list")
  async getAvailableStudentRestrictionsToBypass(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AvailableStudentRestrictionsAPIOutDTO> {
    const availableRestrictionsToBypass =
      await this.applicationRestrictionBypassService.getAvailableStudentRestrictionsToBypass(
        applicationId,
      );
    return {
      availableRestrictionsToBypass: availableRestrictionsToBypass.map(
        (item) => ({
          studentRestrictionId: item.studentRestrictionId,
          restrictionCode: item.restrictionCode,
          studentRestrictionCreatedAt: item.studentRestrictionCreatedAt,
        }),
      ),
    };
  }

  /**
   * Creates a new application restriction bypass.
   * @param payload payload of the application restriction bypass.
   * @param userToken user token.
   * @returns application restriction bypass.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "Cannot create a bypass when there is an active bypass for the same active student restriction id or " +
      "could not find student restriction for the given id or " +
      "cannot create a bypass when student restriction is not active  or " +
      "cannot create a bypass when application is in invalid state.",
  })
  @Roles(Role.AESTBypassStudentRestriction)
  @Post()
  async bypassRestriction(
    @Body() payload: BypassRestrictionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const applicationRestrictionBypass =
        await this.applicationRestrictionBypassService.bypassRestriction(
          payload,
          userToken.userId,
        );
      return { id: applicationRestrictionBypass.id };
    } catch (error) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS:
          case STUDENT_RESTRICTION_NOT_FOUND:
          case STUDENT_RESTRICTION_IS_NOT_ACTIVE:
          case APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }

  /**
   * Removes an application restriction bypass.
   * @param userToken user token.
   * @param payload payload of the application restriction bypass.
   * @param id id of the application restriction bypass to remove.
   */
  @ApiNotFoundResponse({
    description: "Application restriction bypass not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Cannot remove a bypass when student restriction is not active or " +
      "cannot remove a bypass when application restriction bypass is not active.",
  })
  @Roles(Role.AESTBypassStudentRestriction)
  @Patch(":id")
  async removeBypassRestriction(
    @UserToken() userToken: IUserToken,
    @Body() payload: RemoveBypassRestrictionAPIInDTO,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    try {
      await this.applicationRestrictionBypassService.removeBypassRestriction(
        id,
        payload.note,
        userToken.userId,
      );
    } catch (error) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_RESTRICTION_BYPASS_NOT_FOUND:
            throw new NotFoundException(error.message);
          case STUDENT_RESTRICTION_IS_NOT_ACTIVE:
          case APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }
}
