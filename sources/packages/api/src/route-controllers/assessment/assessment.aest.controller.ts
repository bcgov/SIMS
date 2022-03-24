import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  StudentAppealService,
  StudentAssessmentService,
  StudentScholasticStandingsService,
} from "../../services";
import { AssessmentTriggerType } from "../../database/entities";
import {
  AssessmentHistorySummaryDTO,
  RequestAssessmentSummaryDTO,
} from "./models/assessment.dto";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.Student}-application`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * todo:comment

   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId") applicationId: number,
  ): Promise<RequestAssessmentSummaryDTO[]> {
    const [studentAppealQuery, studentScholasticStandingsQuery] =
      await Promise.all([
        this.studentAppealService.getPendingAndDeniedAppeals(applicationId),
        this.studentScholasticStandingsService.getPendingAndDeniedScholasticStanding(
          applicationId,
        ),
      ]);

    return [
      ...studentAppealQuery.map((appeals) => ({
        ...appeals,
        triggerType: AssessmentTriggerType.StudentAppeal,
      })),
      ...studentScholasticStandingsQuery.map((scholasticStanding) => ({
        ...scholasticStanding,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
      })),
    ] as RequestAssessmentSummaryDTO[];
  }
  /**
   * todo:comment

   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId") applicationId: number,
  ): Promise<AssessmentHistorySummaryDTO[]> {
    console.log("herre history", applicationId);
    const a = await this.studentAssessmentService.AssessmentHistorySummary(
      applicationId,
    );
    console.log(a, "+++++++++++++++++++++++++++");
    return [] as AssessmentHistorySummaryDTO[];
  }
}
