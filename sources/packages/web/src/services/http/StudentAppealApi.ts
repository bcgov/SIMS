import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentAppealRequestDTO } from "@/types/contracts/student/StudentRequestChange";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  public async submitStudentAppeal(
    applicationId: number,
    studentAppealRequests: StudentAppealRequestDTO[],
  ): Promise<void> {
    await this.postCall<StudentAppealRequestDTO[]>(
      this.addClientRoot(`appeal/application/${applicationId}`),
      studentAppealRequests,
    );
  }
}
