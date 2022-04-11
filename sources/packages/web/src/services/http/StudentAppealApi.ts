import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  StudentAppealAPIInDTO,
  StudentAppealAPIOutDTO,
  StudentAppealApprovalAPIInDTO,
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
    await this.postCall<StudentAppealAPIInDTO>(
      this.addClientRoot(`appeal/application/${applicationId}`),
      studentAppeal,
    );
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
    return this.patchCall<StudentAppealApprovalAPIInDTO>(
      this.addClientRoot(`appeal/${appealId}/requests`),
      { requests: approvals },
    );
  }
}
