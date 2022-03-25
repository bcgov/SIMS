import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssessmentHistorySummaryDTO,
  RequestAssessmentSummaryDTO,
} from "@/types";

/**
 * Http API client for Student Assessments.
 */
export class StudentAssessmentApi extends HttpBaseClient {
  /**
   * Get all requested assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application number.
   * @returns RequestAssessmentSummaryDTO list.
   */
  public async getAssessmentRequest(
    applicationId: number,
  ): Promise<RequestAssessmentSummaryDTO[]> {
    return this.getCallTyped<RequestAssessmentSummaryDTO[]>(
      this.addClientRoot(`assessment/application/${applicationId}/requests`),
    );
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
  public async getAssessmentHistory(
    applicationId: number,
  ): Promise<AssessmentHistorySummaryDTO[]> {
    return this.getCallTyped<AssessmentHistorySummaryDTO[]>(
      this.addClientRoot(`assessment/application/${applicationId}/history`),
    );
  }
}
