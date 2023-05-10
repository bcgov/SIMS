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
  RequestAssessmentSummaryAPIOutDTO,
} from "./models/assessment.dto";
import { ApiTags } from "@nestjs/swagger";
import { AssessmentControllerService } from "./assessment.controller.service";

/**
 * Assessment controller for institutions.
 */
@AllowAuthorizedParty(AuthorizedParties.institution)
@Controller("assessment")
@IsBCPublicInstitution()
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
  @HasStudentDataAccess("studentId")
  @Get("student/:studentId/application/:applicationId/requests")
  async getRequestedAssessmentSummary(
    @Param("studentId", ParseIntPipe) studentId: number,
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return this.assessmentControllerService.requestedStudentAssessmentSummary(
      applicationId,
      studentId,
    );
  }

  /**
   * Method to get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param studentId student id.
   * @param applicationId, application id.
   * @returns summary of the assessment history for a student application.
   */
  @HasStudentDataAccess("studentId")
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
}
