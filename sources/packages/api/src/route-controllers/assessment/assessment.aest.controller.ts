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
import {
  AssessmentTriggerType,
  ScholasticStandingStatus,
  StudentAppealStatus,
} from "../../database/entities";
import { RequestAssessmentSummaryDTO } from "./models/assessment.dto";
import { AssessmentHistory } from "../../services/student-assessment/student-assessment.models";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly studentScholasticStandingsService: StudentScholasticStandingsService,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super();
  }

  /**
   * Method to get all requested assessments for a student
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
    const [studentAppeal, studentScholasticStandings] = await Promise.all([
      this.studentAppealService.getPendingAndDeniedAppeals(applicationId),
      this.studentScholasticStandingsService.getPendingAndDeniedScholasticStanding(
        applicationId,
      ),
    ]);

    let requestedAssessments = [
      ...studentAppeal.map((appeals) => ({
        submittedDate: appeals.submittedDate,
        status: appeals.status,
        triggerType: AssessmentTriggerType.StudentAppeal,
      })),
      ...studentScholasticStandings.map((scholasticStanding) => ({
        submittedDate: scholasticStanding.submittedDate,
        status: scholasticStanding.status,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
      })),
    ];

    // submitted date sorting
    requestedAssessments = requestedAssessments.sort((first, second) =>
      first.submittedDate > second.submittedDate ? 1 : -1,
    );
    // sorting with status and returning
    return requestedAssessments.sort((first) =>
      first.status === StudentAppealStatus.Pending ||
      first.status === ScholasticStandingStatus.Pending
        ? -1
        : 1,
    );
  }

  /**
   * Method to get history of assessments for an application,
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
  ): Promise<AssessmentHistory[]> {
    return this.studentAssessmentService.assessmentHistorySummary(
      applicationId,
    );
  }
}
