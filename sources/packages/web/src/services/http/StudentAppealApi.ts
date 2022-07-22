import { getPaginationQueryString } from "@/helpers";
import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { PaginationOptions } from "@/types";
import { PaginatedResultsAPIOutDTO } from "./dto";
import {
  StudentAppealAPIInDTO,
  StudentAppealAPIOutDTO,
  StudentAppealApprovalAPIInDTO,
  StudentAppealPendingSummaryAPIOutDTO,
  StudentAppealRequestApprovalAPIInDTO,
} from "./dto/StudentAppeal.dto";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall<StudentAppealAPIInDTO>(
        this.addClientRoot(`appeal/application/${applicationId}`),
        studentAppeal,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  async getStudentAppealWithRequests(
    appealId: number,
  ): Promise<StudentAppealAPIOutDTO> {
    return this.getCallTyped<StudentAppealAPIOutDTO>(
      this.addClientRoot(`appeal/${appealId}/requests`),
    );
  }

  async approveStudentAppealRequests(
    appealId: number,
    approvals: StudentAppealRequestApprovalAPIInDTO[],
  ): Promise<void> {
    try {
      await this.patchCall<StudentAppealApprovalAPIInDTO>(
        this.addClientRoot(`appeal/${appealId}/requests`),
        { requests: approvals },
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
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
    return this.getCallTyped<
      PaginatedResultsAPIOutDTO<StudentAppealPendingSummaryAPIOutDTO>
    >(this.addClientRoot(url));
  }
}
