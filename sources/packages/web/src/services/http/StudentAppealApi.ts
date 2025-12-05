import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import {
  DetailedStudentAppealRequestAPIOutDTO,
  EligibleApplicationsForAppealAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  StudentApplicationAppealAPIInDTO,
  StudentAppealAPIOutDTO,
  StudentAppealApprovalAPIInDTO,
  StudentAppealPendingSummaryAPIOutDTO,
  StudentAppealRequestApprovalAPIInDTO,
  StudentAppealRequestAPIOutDTO,
  StudentAppealAPIInDTO,
  StudentAppealSummaryAPIOutDTO,
} from "./dto";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  /**
   * Submit a student appeal associated with an application.
   * @param applicationId application for which the appeal is submitted.
   * @param payload student appeal with appeal requests.
   */
  async submitApplicationAppeal(
    applicationId: number,
    payload: StudentApplicationAppealAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(`appeal/application/${applicationId}`),
      payload,
    );
  }

  /**
   * Submit a student appeal, not associated with an application.
   * Only one type of appeal is allowed to be submitted.
   * @param payload student appeal request.
   */
  async submitStudentAppeal(payload: StudentAppealAPIInDTO): Promise<void> {
    await this.postCall(this.addClientRoot("appeal"), payload);
  }

  /**
   * Get student application appeal.
   * @param appealId appeal id.
   * @param studentId student id.
   * @param applicationId application id.
   * @returns student application appeal.
   */
  async getStudentAppealWithRequests<
    T extends
      | DetailedStudentAppealRequestAPIOutDTO
      | StudentAppealRequestAPIOutDTO,
  >(
    appealId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<StudentAppealAPIOutDTO<T>> {
    const endpoint = studentId
      ? `appeal/student/${studentId}/application/${applicationId}/appeal/${appealId}/requests`
      : `appeal/${appealId}/requests`;
    return this.getCall<StudentAppealAPIOutDTO<T>>(
      this.addClientRoot(endpoint),
    );
  }

  async approveStudentAppealRequests(
    appealId: number,
    approvals: StudentAppealRequestApprovalAPIInDTO[],
  ): Promise<void> {
    await this.patchCall<StudentAppealApprovalAPIInDTO>(
      this.addClientRoot(`appeal/${appealId}/requests`),
      { requests: approvals },
    );
  }

  /**
   * Gets all pending student application appeals.
   * @param paginationOptions options to execute the pagination.
   * @returns list of student application appeals.
   */
  async getPendingAppeals(
    paginationOptions: PaginationOptions,
  ): Promise<PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>> {
    let url = "appeal/pending?";
    url += getPaginationQueryString(paginationOptions);
    return this.getCall<
      PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }

  /**
   * Get all eligible applications for a student to appeal.
   * @returns list of eligible applications to appeal.
   */
  async getEligibleApplicationsForAppeal(): Promise<EligibleApplicationsForAppealAPIOutDTO> {
    return this.getCall(this.addClientRoot("appeal/eligible-applications"));
  }

  /**
   * Get the summary of all the appeals submitted by the student.
   * @returns summary of student appeals.
   */
  async getStudentAppealSummary(): Promise<StudentAppealSummaryAPIOutDTO> {
    return this.getCall(this.addClientRoot("appeal"));
  }
}
