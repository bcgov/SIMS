import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
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
   * Controller to get all request assessments for an student
   * application, i.e, this will fetch the combination of
   * pending and denied student appeal and scholastic
   * standings for an application.
   * @param applicationId, application number.
   * @returns RequestAssessmentSummaryDTO list.
   */
  @Get("application/:applicationId/requests")
  @ApiOkResponse({
    description: "Requested assessment for the application found.",
  })
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
   * Controller to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns AssessmentHistorySummaryDTO list.
   */
  @Get("application/:applicationId/history")
  @ApiOkResponse({
    description: "assessments history found for the application.",
  })
  async getAssessmentHistorySummary(
    @Param("applicationId") applicationId: number,
  ): Promise<AssessmentHistorySummaryDTO[]> {
    const assessmentHistory =
      await this.studentAssessmentService.AssessmentHistorySummary(
        applicationId,
      );
    return assessmentHistory.map(
      (assessment) => assessment as AssessmentHistorySummaryDTO,
    );
  }
}
