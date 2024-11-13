import { Controller, Get, Param, ParseIntPipe } from "@nestjs/common";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  HasStudentDataAccess,
  IsBCPublicInstitution,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  AwardDetailsAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
} from "./models/assessment.dto";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { AssessmentControllerService } from "..";

/**
 * Assessment controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("assessment")
@IsBCPublicInstitution()
@HasStudentDataAccess("studentId", "applicationId")
@ApiTags(`${ClientTypeBaseRoute.Institution}-assessment`)
export class AssessmentInstitutionsController extends BaseController {
  constructor(
    private readonly assessmentControllerService: AssessmentControllerService,
  ) {
    super();
  }

  /**
   * Get all pending and declined requests related to an application which would result
   * a new assessment when that request is approved.
   * @param studentId student id.
   * @param applicationId application id.
   * @returns assessment requests or exceptions for the student application.
   */
  @Get("student/:studentId/application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return this.assessmentControllerService.requestedStudentAssessmentSummary(
      applicationId,
      { studentId },
    );
  }

  /**
   * Get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param studentId student id.
   * @param applicationId, application id.
   * @returns summary of the assessment history for a student application.
   */
  @Get("student/:studentId/application/:applicationId/history")
  async getAssessmentHistorySummary(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return this.assessmentControllerService.getAssessmentHistorySummary(
      applicationId,
      studentId,
    );
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param studentId, student id.
   * @param applicationId, application id.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  @Get(
    "student/:studentId/application/:applicationId/assessment/:assessmentId/noa",
  )
  @ApiNotFoundResponse({
    description: "Assessment id not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: "Notice of assessment data is not present.",
  })
  async getAssessmentNOA(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentNOA(assessmentId, {
      studentId: studentId,
      applicationId,
      maskTotalFamilyIncome: true,
    });
  }

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param studentId, student id.
   * @param applicationId, application id.
   * @param assessmentId assessment to which awards details belong to.
   * @returns estimated and actual award details.
   */
  @Get(
    "student/:studentId/application/:applicationId/assessment/:assessmentId/award",
  )
  @ApiNotFoundResponse({
    description: "Assessment not found.",
  })
  async getAssessmentAwardDetails(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    return this.assessmentControllerService.getAssessmentAwardDetails(
      assessmentId,
      { studentId, applicationId, includeDocumentNumber: true },
    );
  }
}
