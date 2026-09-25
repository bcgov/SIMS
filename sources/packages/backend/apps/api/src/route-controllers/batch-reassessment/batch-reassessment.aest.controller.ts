import { Body, Controller, Get, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
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
  BatchReassessmentAPIInDTO,
  BatchReassessmentSummaryAPIOutDTO,
} from "./models/batch-reassessment.dto";
import { BatchReassessmentService } from "../../services";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

/**
 * Provides AEST endpoints for submitting and reviewing batch manual reassessments.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("batch-reassessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-reassessment`)
export class BatchReassessmentAESTController extends BaseController {
  constructor(
    private readonly batchReassessmentService: BatchReassessmentService,
  ) {
    super();
  }

  /**
   * Triggers a batch manual reassessment for a list of application numbers.
   * Multiple invocations are prevented from running concurrently via the sequence control mechanism.
   * @param payload batch reassessment request payload.
   * @param userToken authenticated AEST user token.
   * @returns void.
   */
  @Roles(Role.AESTBatchReassessment)
  @Post()
  async createBatchReassessment(
    @Body() payload: BatchReassessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const batchReassessment =
      await this.batchReassessmentService.createBatchReassessment(
        payload.applicationNumbers,
        payload.note,
        userToken.userId,
      );
    return { id: batchReassessment.id };
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  @Roles(Role.AESTBatchReassessment)
  @Get()
  async getBatchReassessments(): Promise<BatchReassessmentSummaryAPIOutDTO[]> {
    return await this.batchReassessmentService.getBatchReassessmentSummaries();
  }
}
