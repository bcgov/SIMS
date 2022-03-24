import ApiClient from "@/services/http/ApiClient";
import {
  AssessmentHistorySummaryDTO,
  RequestAssessmentSummaryDTO,
} from "@/types";

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
   * Get all request assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application number
   * TODO: UPDATE RETURN COMMNET
   * @returns
   */
  async getAssessmentRequest(
    applicationId: number,
  ): Promise<RequestAssessmentSummaryDTO> {
    return ApiClient.StudentAssessmentApi.getAssessmentRequest(applicationId);
  }
  /**
   * TODO: UPDATE
   * @returns
   */
  async getAssessmentHistory(
    applicationId: number,
  ): Promise<AssessmentHistorySummaryDTO> {
    return ApiClient.StudentAssessmentApi.getAssessmentHistory(applicationId);
  }
}
