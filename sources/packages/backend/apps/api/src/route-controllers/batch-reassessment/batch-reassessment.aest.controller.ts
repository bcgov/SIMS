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
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import {
  BatchReassessmentAPIInDTO,
  BatchSubmissionResultAPIOutDTO,
} from "./models/batch-reassessment.dto";
import { BatchReassessmentService } from "../../services";

const BATCH_REASSESSMENT_ALREADY_IN_PROGRESS =
  "BATCH_REASSESSMENT_ALREADY_IN_PROGRESS;";

const BATCH_REASSESSMENT_ALREADY_IN_PROGRESS_MESSAGE =
  "A batch manual reassessment is already in progress.";

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
   * @param payload batch reassessment request payload.
   * @param userToken authenticated AEST user token.
   * @returns void.
   */
  @Roles(Role.AESTBatchReassessment)
  @Post()
  @ApiUnprocessableEntityResponse({
    description: BATCH_REASSESSMENT_ALREADY_IN_PROGRESS_MESSAGE,
  })
  async createBatchReassessment(
    @Body() payload: BatchReassessmentAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    // TODO We can do this via sequence control
    if (await this.batchReassessmentService.isBatchInProgress()) {
      throw new UnprocessableEntityException(
        new ApiProcessError(
          BATCH_REASSESSMENT_ALREADY_IN_PROGRESS_MESSAGE,
          BATCH_REASSESSMENT_ALREADY_IN_PROGRESS,
        ),
      );
    }
    await this.batchReassessmentService.createBatchReassessment(
      payload.applicationNumbers,
      payload.note,
      userToken.userId,
    );
  }

  /**
   * Gets batch manual reassessment submissions.
   * @returns batch manual reassessment submissions.
   */
  @Roles(Role.AESTBatchReassessment)
  @Get()
  async getBatchReassessment(): Promise<BatchSubmissionResultAPIOutDTO[]> {
    const batches =
      await this.batchReassessmentService.getBatchReassessmentSummary();
    return batches.map((batch) => {
      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        createdAt: batch.createdAt,
        creatorFirstName: batch.creatorFirstName,
        creatorLastName: batch.creatorLastName,
        successCount: Number(batch.successCount),
        failureCount: Number(batch.failureCount),
        status: batch.status,
      };
    });
  }
}
