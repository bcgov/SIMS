import ApiClient from "@/services/http/ApiClient";
import {
  StudentAppealApiInDTO,
  StudentAppealApiOutDTO,
  StudentAppealRequestApprovalApiInDTO,
} from "./http/dto/StudentAppeal.dto";

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
    studentAppeal: StudentAppealApiInDTO,
  ): Promise<void> {
    await ApiClient.StudentAppealApi.submitStudentAppeal(
      applicationId,
      studentAppeal,
    );
  }

  async getStudentAppealWithRequests(
    appealId: number,
  ): Promise<StudentAppealApiOutDTO> {
    return ApiClient.StudentAppealApi.getStudentAppealWithRequests(appealId);
  }

  async approveStudentAppealRequests(
    appealId: number,
    approvals: StudentAppealRequestApprovalApiInDTO[],
  ): Promise<void> {
    await ApiClient.StudentAppealApi.approveStudentAppealRequests(
      appealId,
      approvals,
    );
  }
}
