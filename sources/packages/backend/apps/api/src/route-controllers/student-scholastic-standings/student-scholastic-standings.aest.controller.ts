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
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import { UserGroups } from "../../auth/user-groups.enum";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import {
  ReverseScholasticStandingAPIInDTO,
  ScholasticStandingSubmittedDetailsAPIOutDTO,
  ScholasticStandingSummaryDetailsAPIOutDTO,
} from "./models/student-scholastic-standings.dto";
import { ScholasticStandingControllerService } from "..";
import { ScholasticStandingReversalService } from "../../services";
import { IUserToken, Role } from "../../auth";
import { CustomNamedError } from "@sims/utilities";
import {
  SCHOLASTIC_STANDING_NOT_FOUND,
  SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED,
  SCHOLASTIC_STANDING_REVERSAL_NOT_UPDATED,
} from "../../constants";

/**
 * Scholastic standing controller for AEST Client.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("scholastic-standing")
@ApiTags(`${ClientTypeBaseRoute.AEST}-scholastic-standing`)
export class ScholasticStandingAESTController extends BaseController {
  constructor(
    private readonly scholasticStandingControllerService: ScholasticStandingControllerService,
    private readonly scholasticStandingReversalService: ScholasticStandingReversalService,
  ) {
    super();
  }

  /**
   * Get Scholastic Standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @returns Scholastic Standing.
   */
  @Get(":scholasticStandingId")
  @ApiNotFoundResponse({
    description: "Scholastic Standing not found.",
  })
  async getScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
  ): Promise<ScholasticStandingSubmittedDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStanding(
      scholasticStandingId,
    );
  }

  /**
   * Get Scholastic Standing summary details.
   * @param studentId student id to retrieve the scholastic standing summary details.
   * @returns Scholastic Standing Summary details.
   */
  @Get("summary/student/:studentId")
  @ApiNotFoundResponse({ description: "Student does not exists." })
  async getScholasticStandingSummary(
    @Param("studentId", ParseIntPipe) studentId: number,
  ): Promise<ScholasticStandingSummaryDetailsAPIOutDTO> {
    return this.scholasticStandingControllerService.getScholasticStandingSummary(
      studentId,
    );
  }

  /**
   * Reverse a scholastic standing and create a note for the reversal.
   * Based on the scholastic standing type, there will be additional steps as part of the reversal process.
   * For all the scholastic standing types which creates re-assessment, a new re-assessment will be created
   * during the reversal process to reverse the study period changes.
   * For all the scholastic standing types which archives the application, the archiving will be reversed.
   * @param scholasticStandingId scholastic standing id to reverse.
   * @param payload payload for the scholastic standing reversal.
   */
  @Roles(Role.StudentReverseScholasticStanding)
  @Patch(":scholasticStandingId/reverse")
  @ApiNotFoundResponse({
    description: "Scholastic standing not found.",
  })
  async reverseScholasticStanding(
    @Param("scholasticStandingId", ParseIntPipe) scholasticStandingId: number,
    @Body() payload: ReverseScholasticStandingAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.scholasticStandingReversalService.reverseScholasticStanding(
        scholasticStandingId,
        payload.note,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case SCHOLASTIC_STANDING_NOT_FOUND:
            throw new NotFoundException(error.message);
          case SCHOLASTIC_STANDING_REVERSAL_NOT_ALLOWED:
          case SCHOLASTIC_STANDING_REVERSAL_NOT_UPDATED:
            throw new UnprocessableEntityException(error.message);
          default:
            throw error;
        }
      }
      throw error;
    }
  }
}
