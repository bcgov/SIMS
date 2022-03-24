import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentAppealDTO } from "@/types/contracts/student/StudentRequestChange";

/**
 * Http API client for Student Appeal.
 */
export class StudentAppealApi extends HttpBaseClient {
  public async submitStudentAppeal(
    applicationId: number,
    studentAppeal: StudentAppealDTO,
  ): Promise<void> {
    await this.postCall<StudentAppealDTO>(
      this.addClientRoot(`appeal/application/${applicationId}`),
      studentAppeal,
    );
  }
}
