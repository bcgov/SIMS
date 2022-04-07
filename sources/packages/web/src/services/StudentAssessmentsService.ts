import ApiClient from "@/services/http/ApiClient";
import {
  AssessmentHistorySummaryApiOutDTO,
  RequestAssessmentSummaryApiOutDTO,
} from "./http/dto/Assessment.dto";

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
   * @returns RequestAssessmentSummaryApiOutDTO list.
   */
  async getAssessmentRequest(
    applicationId: number,
  ): Promise<RequestAssessmentSummaryApiOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentRequest(applicationId);
  }
  /**
   * Get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application number.
   * @returns AssessmentHistorySummaryDTO list.
   */
  async getAssessmentHistory(
    applicationId: number,
  ): Promise<AssessmentHistorySummaryApiOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentHistory(applicationId);
  }
}
