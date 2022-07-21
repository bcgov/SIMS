import ApiClient from "@/services/http/ApiClient";
import { PaginationOptions, StudentAppealRequest } from "@/types";
import {
  StudentAppealAPIOutDTO,
  StudentAppealPendingSummaryAPIOutDTO,
  StudentAppealRequestAPIInDTO,
  StudentAppealRequestApprovalAPIInDTO,
} from "@/services/http/dto/StudentAppeal.dto";
import { PaginatedResultsAPIOutDTO } from "./http/dto";

/**
 * Client service layer for Student Appeal.
 */
export class StudentAppealService {
  // Shared Instance
  private static instance: StudentAppealService;

  public static get shared(): StudentAppealService {
    return this.instance || (this.instance = new this());
  }

  async submitStudentAppeal(
    applicationId: number,
    appealRequests: StudentAppealRequest[],
  ): Promise<void> {
    const studentAppealRequests = appealRequests.map(
      (request) =>
        ({
          formName: request.formName,
          formData: request.data,
        } as StudentAppealRequestAPIInDTO),
    );
    await ApiClient.StudentAppealApi.submitStudentAppeal(applicationId, {
      studentAppealRequests,
    });
  }

  async getStudentAppealWithRequests(
    appealId: number,
  ): Promise<StudentAppealAPIOutDTO> {
    return ApiClient.StudentAppealApi.getStudentAppealWithRequests(appealId);
  }

  async approveStudentAppealRequests(
    appealId: number,
    approvals: StudentAppealRequestApprovalAPIInDTO[],
  ): Promise<void> {
    await ApiClient.StudentAppealApi.approveStudentAppealRequests(
      appealId,
      approvals,
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
    return ApiClient.StudentAppealApi.getPendingAppeals(paginationOptions);
  }
}
