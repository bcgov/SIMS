import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import { AllowAuthorizedParty, Groups } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AwardDetailsAPIOutDTO,
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
    private readonly assessmentControllerService: AssessmentControllerService,
  ) {
    super();
  }

  /**
   * Get all requests related to an assessments for a student
   * application, i.e, this will fetch all pending and denied
   * student appeals for an application or possible application
   * exceptions that will prevent the assessment to proceed till
   * they are approved, for instance, when a document is uploaded
   * and need to be reviewed.
   * @param applicationId application number.
   * @returns assessment requests or exceptions for a student application.
   */
  @Get("application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getRequestedAssessmentSummary(
      applicationId,
    );
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
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getAssessmentHistorySummary(
      applicationId,
    );
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

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @returns estimated and actual award details.
   */
  @Get(":assessmentId/award")
  @ApiNotFoundResponse({
    description: "Assessment not found.",
  })
  async getAssessmentAwardDetails(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentAwardDetails(
      assessmentId,
      true,
    );
  }
}
