import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AllowAuthorizedParty, Groups, Roles } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { Role } from "../../auth";
import { UserGroups } from "../../auth/user-groups.enum";
import { ClientTypeBaseRoute } from "../../types";
import BaseController from "../BaseController";
import { BatchReassessmentApplicationResult } from "@sims/sims-db";
import { BatchSubmissionResultAPIOutDTO } from "./models/batch-reassessment.dto";
import { BatchReassessmentService } from "../../services";
import { getUserFullName } from "../../utilities";

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
    const batches = await this.batchReassessmentService.getBatchReassessment();
    // TODO It's not efficient return all applications. Create a custom dto with counts.
    return batches.map((batch) => {
      const successfulApplications =
        batch.batchReassessmentApplications?.filter(
          (application) =>
            application.result === BatchReassessmentApplicationResult.Success,
        ).length ?? 0;
      const failedApplications =
        batch.batchReassessmentApplications?.filter(
          (application) =>
            application.result === BatchReassessmentApplicationResult.Failed,
        ).length ?? 0;

      return {
        batchId: batch.id,
        submittedDate: batch.createdAt,
        submittedBy: getUserFullName(batch.creator),
        totalApplications: successfulApplications + failedApplications,
        successfulApplications,
        failedApplications,
        status: batch.status,
      };
    });
  }
}
