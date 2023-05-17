import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssessmentHistorySummaryAPIOutDTO,
  AssessmentNOAAPIOutDTO,
  RequestAssessmentSummaryAPIOutDTO,
  AwardDetailsAPIOutDTO,
} from "@/services/http/dto";

/**
 * Http API client for Student Assessments.
 */
export class StudentAssessmentApi extends HttpBaseClient {
  /**
   * Get all requested assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application id.
   * @param studentId, student id.
   * @returns Request assessment summary list.
   */
  public async getAssessmentRequest(
    applicationId: number,
    studentId?: number,
  ): Promise<RequestAssessmentSummaryAPIOutDTO[]> {
    const endpoint = studentId
      ? `assessment/student/${studentId}/application/${applicationId}/requests`
      : `assessment/application/${applicationId}/requests`;

    return this.getCall<RequestAssessmentSummaryAPIOutDTO[]>(
      this.addClientRoot(endpoint),
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
   * @returns AssessmentHistorySummaryDTO list.
   */
  public async getAssessmentHistory(
    applicationId: number,
    studentId?: number,
  ): Promise<AssessmentHistorySummaryAPIOutDTO[]> {
    const endpoint = studentId
      ? `assessment/student/${studentId}/application/${applicationId}/history`
      : `assessment/application/${applicationId}/history`;
    return this.getCall<AssessmentHistorySummaryAPIOutDTO[]>(
      this.addClientRoot(endpoint),
    );
  }

  /**
   * Get the NOA values for a student application on a particular assessment.
   * @param assessmentId assessment id to get the NOA values.
   * @returns NOA and application data.
   */
  async getAssessmentNOA(
    assessmentId: number,
  ): Promise<AssessmentNOAAPIOutDTO> {
    return this.getCall<AssessmentNOAAPIOutDTO>(
      this.addClientRoot(`assessment/${assessmentId}/noa`),
    );
  }

  /**
   * Confirm Assessment of a Student.
   * @param assessmentId assessment id to be confirmed.
   */
  async confirmAssessmentNOA(assessmentId: number): Promise<void> {
    await this.patchCall(
      this.addClientRoot(`assessment/${assessmentId}/confirm-assessment`),
      null,
    );
  }

  /**
   * Get estimated and actual(if present) award details of an assessment.
   * @param assessmentId assessment to which awards details belong to.
   * @param studentId, student id.
   * @returns estimated and actual award details.
   */
  async getAssessmentAwardDetails(
    assessmentId: number,
    studentId?: number,
  ): Promise<AwardDetailsAPIOutDTO> {
    const endpoint = studentId
      ? `assessment/student/${studentId}/assessment/${assessmentId}/award`
      : `assessment/${assessmentId}/award`;
    return this.getCall<AwardDetailsAPIOutDTO>(this.addClientRoot(endpoint));
  }
}
