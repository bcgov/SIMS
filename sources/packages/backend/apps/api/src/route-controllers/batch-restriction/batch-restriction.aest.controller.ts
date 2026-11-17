import {
  Body,
  Controller,
  Get,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiTags, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { IUserToken, Role } from "../../auth";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  BatchRestrictionAPIInDTO,
  BatchRestrictionSummaryAPIOutDTO,
} from "./models/batch-restriction.dto";
import { BatchRestrictionService, RestrictionService } from "../../services";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { getUserFullName } from "../../utilities";
import { RestrictionType } from "@sims/sims-db";

/**
 * Provides AEST endpoints for submitting and reviewing batch restrictions.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Roles(Role.AESTBatchRestriction)
@Controller("batch-restriction")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-restriction`)
export class BatchRestrictionAESTController extends BaseController {
  constructor(
    private readonly batchRestrictionService: BatchRestrictionService,
    private readonly restrictionService: RestrictionService,
  ) {
    super();
  }

  /**
   * Adds a provincial restriction to the students of the given application numbers.
   * The same note is applied to all restrictions added through the batch.
   * @param payload restriction, application numbers, and note for the batch.
   * @param userToken authenticated AEST user token.
   * @returns the primary identifier of the created batch.
   */
  @ApiUnprocessableEntityResponse({
    description:
      "The given restriction type is not Provincial. Only provincial restrictions can be added.",
  })
  @Post()
  async createBatchRestriction(
    @Body() payload: BatchRestrictionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const restrictionExists = await this.restrictionService.restrictionExists(
      payload.restrictionId,
      RestrictionType.Provincial,
    );
    if (!restrictionExists) {
      throw new UnprocessableEntityException(
        "The given restriction type is not Provincial. Only provincial restrictions can be added.",
      );
    }
    const batchRestriction =
      await this.batchRestrictionService.createBatchRestriction(
        payload.restrictionId,
        payload.applicationNumbers,
        payload.note,
        userToken.userId,
      );
    return { id: batchRestriction.id };
  }

  /**
   * Gets the batch restriction submissions.
   * @returns batch restriction submissions.
   */
  @Get()
  async getBatchRestrictions(): Promise<BatchRestrictionSummaryAPIOutDTO[]> {
    const summaries =
      await this.batchRestrictionService.getBatchRestrictionSummaries();
    return summaries.map((summary) => ({
      id: summary.id,
      batchNumber: summary.batchNumber,
      createdAt: summary.createdAt,
      creatorName: getUserFullName({
        firstName: summary.creatorFirstName,
        lastName: summary.creatorLastName,
      }),
      restrictionCode: summary.restrictionCode,
      restrictionDescription: summary.restrictionDescription,
      totalCount: summary.totalCount,
      successCount: summary.successCount,
      failureCount: summary.failureCount,
    }));
  }
}
