import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  AssessmentHistorySummaryDTO,
  RequestAssessmentSummaryDTO,
} from "@/types";
import { StudentAppealDTO } from "@/types/contracts/student/StudentRequestChange";

/**
 * Http API client for Student Assessments.
 */
export class StudentAssessmentApi extends HttpBaseClient {
  /**
   * Get all request assessments for an student application,
   * i.e, this will fetch the combination of pending and denied
   * student appeal and scholastic standings for an application.
   * @param applicationId, application number
   * TODO: UPDATE RETURN COMMNET
   * @returns
   */
  public async getAssessmentRequest(
    applicationId: number,
  ): Promise<RequestAssessmentSummaryDTO> {
    return this.getCallTyped<RequestAssessmentSummaryDTO>(
      this.addClientRoot(`assessment/application/${applicationId}/requests`),
    );
  }
  /**
   * TODO: UPDATE RETURN COMMNET
   * @param applicationId, application number
   * TODO: UPDATE RETURN COMMNET
   * @returns
   */
  public async getAssessmentHistory(
    applicationId: number,
  ): Promise<AssessmentHistorySummaryDTO> {
    return this.getCallTyped<AssessmentHistorySummaryDTO>(
      this.addClientRoot(`assessment/application/${applicationId}/history`),
    );
  }
}
