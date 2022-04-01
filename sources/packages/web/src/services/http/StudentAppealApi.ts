import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentAppealDTO } from "@/types/contracts/student/StudentRequestChange";
import { StudentAppealApiOutDTO } from "./dto/StudentAppeal.dto";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealDTO,
  ): Promise<void> {
    await this.postCall<StudentAppealDTO>(
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
}
