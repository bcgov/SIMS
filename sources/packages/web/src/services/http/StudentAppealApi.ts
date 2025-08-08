import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import {
  DetailedStudentAppealRequestAPIOutDTO,
  PaginatedResultsAPIOutDTO,
  StudentAppealAPIInDTO,
  StudentAppealAPIOutDTO,
  StudentAppealApprovalAPIInDTO,
  StudentAppealPendingSummaryAPIOutDTO,
  StudentAppealRequestApprovalAPIInDTO,
  StudentAppealRequestAPIOutDTO,
} from "./dto";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealAPIInDTO,
  ): Promise<void> {
    await this.postCall<StudentAppealAPIInDTO>(
      this.addClientRoot(`appeal/application/${applicationId}`),
      studentAppeal,
    );
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
    enableZeroPage = true,
  ): Promise<PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>> {
    let url = "appeal/pending?";
    url += getPaginationQueryString(paginationOptions, enableZeroPage);
    return this.getCall<
      PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
