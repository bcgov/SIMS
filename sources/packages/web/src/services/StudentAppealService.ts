import ApiClient from "@/services/http/ApiClient";
import { PaginationOptions, StudentAppealRequest } from "@/types";
import {
  PaginatedResultsAPIOutDTO,
  StudentAppealAPIOutDTO,
  StudentAppealPendingSummaryAPIOutDTO,
  StudentAppealRequestApprovalAPIInDTO,
  DetailedStudentAppealRequestAPIOutDTO,
  StudentAppealRequestAPIOutDTO,
  EligibleApplicationsForAppealAPIOutDTO,
  StudentAppealSummaryAPIOutDTO,
} from "./http/dto";

/**
 * Client service layer for Student Appeal.
 */
export class StudentAppealService {
  // Shared Instance
  private static instance: StudentAppealService;

  public static get shared(): StudentAppealService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Submit a student appeal associated with an application.
   * @param applicationId application for which the appeal is submitted.
   * @param payload student appeal with appeal requests.
   */
  async submitApplicationAppeal(
    applicationId: number,
    payload: StudentAppealRequest[],
  ): Promise<void> {
    const studentAppealRequests = payload.map((request) => ({
      formName: request.formName,
      formData: request.data,
      files: request.files,
    }));
    await ApiClient.StudentAppealApi.submitApplicationAppeal(applicationId, {
      studentAppealRequests,
    });
  }

  /**
   * Submit a student appeal, not associated with an application.
   * Only one type of appeal is allowed to be submitted.
   * @param payload student appeal request.
   */
  async submitStudentAppeal(payload: StudentAppealRequest): Promise<void> {
    await ApiClient.StudentAppealApi.submitStudentAppeal({
      formName: payload.formName,
      formData: payload.data,
      files: payload.files,
    });
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
      | StudentAppealRequestAPIOutDTO
      | DetailedStudentAppealRequestAPIOutDTO,
  >(
    appealId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<StudentAppealAPIOutDTO<T>> {
    return ApiClient.StudentAppealApi.getStudentAppealWithRequests<T>(
      appealId,
      studentId,
      applicationId,
    );
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

  /**
   * Get all eligible applications for a student to appeal.
   * @returns list of eligible applications to appeal.
   */
  async getEligibleApplicationsForAppeal(): Promise<EligibleApplicationsForAppealAPIOutDTO> {
    return ApiClient.StudentAppealApi.getEligibleApplicationsForAppeal();
  }

  /**
   * Get the summary of all the appeals submitted by the student.
   * @returns summary of student appeals.
   */
  async getStudentAppealSummary(): Promise<StudentAppealSummaryAPIOutDTO> {
    return ApiClient.StudentAppealApi.getStudentAppealSummary();
  }
}
