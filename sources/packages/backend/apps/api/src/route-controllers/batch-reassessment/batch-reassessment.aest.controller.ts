import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { Role } from "../../auth";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { BatchSubmissionResultAPIOutDTO } from "./models/batch-reassessment.dto";
import { BatchReassessmentService } from "../../services";

/**
 * Provides AEST endpoints for submitting and reviewing batch manual reassessments.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment/application/batch-reassessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-reassessment`)
export class BatchReassessmentAESTController extends BaseController {
  constructor(
    private readonly batchReassessmentService: BatchReassessmentService,
  ) {
    super();
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
        createdAt: batch.createdAt,
        creatorFirstName: batch.creatorFirstName,
        creatorLastName: batch.creatorLastName,
        successCount: Number(batch.successCount),
        failedCount: Number(batch.failedCount),
        status: batch.status,
      };
    });
  }
}
