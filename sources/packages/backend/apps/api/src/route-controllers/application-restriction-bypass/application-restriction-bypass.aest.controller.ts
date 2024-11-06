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
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import {
  ApplicationRestrictionBypassAPIOutDTO,
  ApplicationRestrictionBypassHistoryAPIOutDTO,
  AvailableStudentRestrictionAPIOutDTO,
  BypassRestrictionAPIInDTO,
  RemoveBypassRestrictionAPIInDTO,
} from "./models/application-restriction-bypass.dto";
import { ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ApplicationRestrictionBypassService } from "../../services";
import {
  ApplicationRestrictionBypass,
  StudentRestriction,
} from "@sims/sims-db";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { IUserToken } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import {
  ACTIVE_BYPASS_FOR_STUDENT_RESTRICTION_ALREADY_EXISTS,
  APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION,
  APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE,
  APPLICATION_RESTRICTION_BYPASS_NOT_FOUND,
  STUDENT_RESTRICTION_IS_NOT_ACTIVE,
  STUDENT_RESTRICTION_NOT_FOUND,
} from "../../../src/constants";
import { getUserFullName } from "../../utilities";

/**
 * Controller for AEST Application Restriction Bypasses.
 * This consists of all Rest APIs for AEST application restriction bypasses.
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
      throw new NotFoundException(APPLICATION_RESTRICTION_BYPASS_NOT_FOUND);
    }
    return {
      applicationRestrictionBypassId: applicationRestrictionBypass.id,
      studentRestrictionId: applicationRestrictionBypass.studentRestriction.id,
      restrictionCode:
        applicationRestrictionBypass.studentRestriction.restriction
          .restrictionCode,
      applicationRestrictionBypassCreationNote:
        applicationRestrictionBypass.creationNote.description,
      applicationRestrictionBypassRemovalNote:
        applicationRestrictionBypass.removalNote?.description,
      applicationRestrictionBypassCreatedBy: getUserFullName(
        applicationRestrictionBypass.bypassCreatedBy,
      ),
      applicationRestrictionBypassCreatedDate:
        applicationRestrictionBypass.bypassCreatedDate.toISOString(),
      ...(applicationRestrictionBypass.bypassRemovedBy && {
        applicationRestrictionBypassRemovedBy: getUserFullName(
          applicationRestrictionBypass.bypassRemovedBy,
        ),
      }),
      applicationRestrictionBypassRemovedDate:
        applicationRestrictionBypass.bypassRemovedDate?.toISOString(),
      applicationRestrictionBypassBehavior:
        applicationRestrictionBypass.bypassBehavior,
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
  ): Promise<AvailableStudentRestrictionAPIOutDTO> {
    const availableRestrictionsToBypass =
      await this.applicationRestrictionBypassService.getAvailableStudentRestrictionsToBypass(
        applicationId,
      );
    return {
      availableRestrictionsToBypass: availableRestrictionsToBypass.map(
        (item: StudentRestriction) => ({
          studentRestrictionId: item.id,
          restrictionCode: item.restriction.restrictionCode,
          studentRestrictionCreatedAt: item.createdAt,
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
      "Cannot create a bypass when there is an active bypass for the same active student restriction ID or " +
      "could not find student restriction for the given ID or " +
      "cannot create a bypass when student restriction is not active  or " +
      "cannot create a bypass when application is in invalid state.",
  })
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
            throw new UnprocessableEntityException(
              "Cannot create a bypass when there is an active bypass for the same active student restriction ID.",
            );
          case STUDENT_RESTRICTION_NOT_FOUND:
            throw new UnprocessableEntityException(
              "Could not find student restriction for the given ID.",
            );
          case STUDENT_RESTRICTION_IS_NOT_ACTIVE:
            throw new UnprocessableEntityException(
              "Cannot create a bypass when student restriction is not active.",
            );
          case APPLICATION_IN_INVALID_STATE_FOR_APPLICATION_RESTRICTION_BYPASS_CREATION:
            throw new UnprocessableEntityException(
              "Cannot create a bypass when application is in invalid state.",
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }

  @ApiNotFoundResponse({
    description: "Application restriction bypass not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      "Cannot remove a bypass when student restriction is not active or " +
      "cannot remove a bypass when application restriction bypass is not active.",
  })
  @Patch(":id")
  async removeBypassRestriction(
    @UserToken() userToken: IUserToken,
    @Body() payload: RemoveBypassRestrictionAPIInDTO,
    @Param("id", ParseIntPipe) id: number,
  ): Promise<void> {
    try {
      await this.applicationRestrictionBypassService.removeBypassRestriction(
        id,
        payload,
        userToken.userId,
      );
    } catch (error) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_RESTRICTION_BYPASS_NOT_FOUND:
            throw new NotFoundException(
              "Application restriction bypass not found.",
            );
          case STUDENT_RESTRICTION_IS_NOT_ACTIVE:
            throw new UnprocessableEntityException(
              "Cannot remove a bypass when student restriction is not active.",
            );
          case APPLICATION_RESTRICTION_BYPASS_IS_NOT_ACTIVE:
            throw new UnprocessableEntityException(
              "Cannot remove a bypass when application restriction bypass is not active.",
            );
          default:
            throw error;
        }
      }
      throw error;
    }
  }
}
