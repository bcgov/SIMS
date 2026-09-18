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
import { StudentAssessmentService } from "../../services";

/**
 * Provides AEST endpoints for submitting and reviewing batch manual reassessments.
 */
@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment/application/batch-reassessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-batch-reassessment`)
export class BatchReassessmentAESTController extends BaseController {
  constructor(
    private readonly studentAssessmentService: StudentAssessmentService,
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
    const batches = await this.studentAssessmentService.getBatchReassessment();
    // TODO Just get the counts in the query??
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
        submittedDate: batch.submittedDate,
        submittedBy: [batch.submittedBy.firstName, batch.submittedBy.lastName]
          .filter(Boolean)
          .join(" "),
        totalApplications: successfulApplications + failedApplications,
        successfulApplications,
        failedApplications,
        status: batch.status,
      };
    });
  }
}
