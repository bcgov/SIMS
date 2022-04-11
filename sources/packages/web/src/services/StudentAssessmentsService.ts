import ApiClient from "@/services/http/ApiClient";
import {
  AssessmentHistorySummaryAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
} from "@/services/http/dto/Assessment.dto";

/**
 * Client service layer for Student Assessments.
 */
export class StudentAssessmentsService {
  // Shared Instance
  private static instance: StudentAssessmentsService;

  public static get shared(): StudentAssessmentsService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get all requested assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application number.
   * @returns assessment requests for a student application.
   */
  async getAssessmentRequest(
    applicationId: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentRequest(applicationId);
  }
  /**
   * Get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns summary of the assessment history for a student application.
   */
  async getAssessmentHistory(
    applicationId: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentHistory(applicationId);
  }
}
