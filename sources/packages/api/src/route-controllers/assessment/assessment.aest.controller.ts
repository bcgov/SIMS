import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import { StudentAppealService, StudentAssessmentService } from "../../services";
import { AssessmentTriggerType } from "../../database/entities";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("assessment")
@ApiTags(`${ClientTypeBaseRoute.AEST}-assessment`)
export class AssessmentAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly studentAssessmentService: StudentAssessmentService,
    private readonly assessmentControllerService: AssessmentControllerService,
  ) {
    super();
  }

  /**
   * Method to get all requested assessments for a student
   * application, i.e, this will fetch all pending and denied
   * student appeal for an application.
   * @param applicationId, application number.
   * @returns assessment requests for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId") applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const studentAppeal =
      await this.studentAppealService.getPendingAndDeniedAppeals(applicationId);
    return studentAppeal.map((appeals) => ({
      id: appeals.id,
      submittedDate: appeals.submittedDate,
      status: appeals.status,
      triggerType: AssessmentTriggerType.StudentAppeal,
    }));
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

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(":assessmentId/noa")
  @ApiNotFoundResponse({
    description: "Assessment id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("assessmentId") assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId);
  }
}
