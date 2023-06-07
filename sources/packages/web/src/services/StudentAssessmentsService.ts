import ApiClient from "@/services/http/ApiClient";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AwardDetailsAPIOutDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Student Assessments.
 */
export class StudentAssessmentsService {
  // Shared Instance
  private static instance: StudentAssessmentsService;

  static get shared(): StudentAssessmentsService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get all requested assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application id.
   * @param studentId, student id.
   * @returns assessment requests for a student application.
   */
  async getAssessmentRequest(
    applicationId: number,
    studentId?: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentRequest(
      applicationId,
      studentId,
    );
  }
  /**
   * Get history of assessments for an application,
   * i.e, this will have original assessment for the
   * student application, and all approved student
   * appeal and scholastic standings for the application
   * which will have different assessment status.
   * @param applicationId, application id.
   * @param studentId, student id.
   * @returns summary of the assessment history for a student application.
   */
  async getAssessmentHistory(
    applicationId: number,
    studentId?: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    return ApiClient.StudentAssessmentApi.getAssessmentHistory(
      applicationId,
      studentId,
    );
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @param studentId student id.
   * @param applicationId, application id.
   * @returns NOA and application data.
   */
  async getAssessmentNOA(
    assessmentId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return ApiClient.StudentAssessmentApi.getAssessmentNOA(
      assessmentId,
      studentId,
      applicationId,
    );
  }

  /**
   * Confirm Assessment of a Student.
   * @param assessmentId assessment id to be confirmed.
   */
  async confirmAssessmentNOA(assessmentId: number): Promise<void> {
    await ApiClient.StudentAssessmentApi.confirmAssessmentNOA(assessmentId);
  }

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @param studentId, student id.
   * @param applicationId, application id.
   * @returns estimated and actual award details.
   */
  async getAssessmentAwardDetails(
    assessmentId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    return ApiClient.StudentAssessmentApi.getAssessmentAwardDetails(
      assessmentId,
      studentId,
      applicationId,
    );
  }
}
