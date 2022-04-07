import ApiClient from "@/services/http/ApiClient";
import { StudentAppealRequest } from "@/types";
import {
  StudentAppealApiOutDTO,
  StudentAppealRequestApiInDTO,
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
    appealRequests: StudentAppealRequest[],
  ): Promise<void> {
    const studentAppealRequests = appealRequests.map(
      (request) =>
        ({
          formName: request.formName,
          formData: request.data,
        } as StudentAppealRequestApiInDTO),
    );
    await ApiClient.StudentAppealApi.submitStudentAppeal(applicationId, {
      studentAppealRequests,
    });
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
