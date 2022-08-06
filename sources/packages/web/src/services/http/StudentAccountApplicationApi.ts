import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  CreateStudentAccountApplicationAPIInDTO,
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "@/services/http/dto";

export class StudentAccountApplicationApi extends HttpBaseClient {
  /**
   * Create a new student account application to be reviewed by
   * the Ministry to confirm the student's basic BCeID identity.
   * @param payload information to be assessed by the Ministry.
   * @returns student account application created id.
   */
  async createStudentAccountApplication(
    payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot("student-account-application"),
      payload,
    );
  }

  /**
   * Get the summary list of all student account applications
   * waiting to be assessed by the Ministry.
   * @returns summary list of pending student account applications.
   */
  async getPendingStudentAccountApplications(): Promise<
    StudentAccountApplicationSummaryAPIOutDTO[]
  > {
    return await this.getCallTyped<StudentAccountApplicationSummaryAPIOutDTO[]>(
      this.addClientRoot("student-account-application/pending"),
    );
  }

  /**
   * Get the student account application previously submitted
   * by the student for the basic BCeID student account creation.
   * @param id student account application id.
   * @returns student account application.
   */
  async getStudentAccountApplicationById(
    id: number,
  ): Promise<StudentAccountApplicationAPIOutDTO> {
    return await this.getCallTyped<StudentAccountApplicationAPIOutDTO>(
      this.addClientRoot(`student-account-application/${id}`),
    );
  }
}
