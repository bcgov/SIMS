import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentAppealApiInDTO,
  StudentAppealApiOutDTO,
  StudentAppealApprovalApiInDTO,
  StudentAppealRequestApprovalApiInDTO,
} from "./dto/StudentAppeal.dto";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealApiInDTO,
  ): Promise<void> {
    await this.postCall<StudentAppealApiInDTO>(
      this.addClientRoot(`appeal/application/${applicationId}`),
      studentAppeal,
    );
  }

  async getStudentAppealWithRequests(
    appealId: number,
  ): Promise<StudentAppealApiOutDTO> {
    return this.getCallTyped<StudentAppealApiOutDTO>(
      this.addClientRoot(`appeal/${appealId}/requests`),
    );
  }

  async approveStudentAppealRequests(
    appealId: number,
    approvals: StudentAppealRequestApprovalApiInDTO[],
  ): Promise<void> {
    return this.patchCall<StudentAppealApprovalApiInDTO>(
      this.addClientRoot(`appeal/${appealId}/requests`),
      { requests: approvals },
    );
  }
}
