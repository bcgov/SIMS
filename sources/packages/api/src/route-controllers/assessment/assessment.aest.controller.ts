import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
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
import {
  AssessmentHistorySummaryAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
} from "./models/assessment.dto";
import { ApiTags } from "@nestjs/swagger";

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
   * @returns assessment requests for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId") applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const [studentAppeal, studentScholasticStandings] = await Promise.all([
      this.studentAppealService.getPendingAndDeniedAppeals(applicationId),
      this.studentScholasticStandingsService.getPendingAndDeniedScholasticStanding(
        applicationId,
      ),
    ]);

    const requestedAssessments = [
      ...studentAppeal.map((appeals) => ({
        id: appeals.id,
        submittedDate: appeals.submittedDate,
        status: appeals.status,
        triggerType: AssessmentTriggerType.StudentAppeal,
      })),
      ...studentScholasticStandings.map((scholasticStanding) => ({
        id: scholasticStanding.id,
        submittedDate: scholasticStanding.submittedDate,
        status: scholasticStanding.scholasticStandingStatus,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
      })),
    ];

    // status and submitted date sorting
    return requestedAssessments.sort((first, second) => {
      if (
        first.status === second.status &&
        first.submittedDate > second.submittedDate
      ) {
        return -1;
      }
      if (
        (first.status === StudentAppealStatus.Pending &&
          second.status === StudentAppealStatus.Declined) ||
        (first.status === ScholasticStandingStatus.Pending &&
          second.status === ScholasticStandingStatus.Declined)
      ) {
        return -1;
      }
      return 1;
    });
  }

  /**
   * Method to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns summary of the assessment history for a student application.
   */
  @Get("application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("applicationId") applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    const assessments =
      await this.studentAssessmentService.assessmentHistorySummary(
        applicationId,
      );

    return assessments.map((assessment) => ({
      assessmentId: assessment.id,
      submittedDate: assessment.submittedDate,
      triggerType: assessment.triggerType,
      assessmentDate: assessment.assessmentDate,
      status: assessment.status,
      studentAppealId: assessment.studentAppeal?.id,
      studentScholasticStandingId: assessment.studentScholasticStanding?.id,
    }));
  }
}
