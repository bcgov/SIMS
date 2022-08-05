import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { CreateStudentAccountApplicationAPIInDTO } from "@/services/http/dto";

export class StudentAccountApplicationApi extends HttpBaseClient {
  async createStudentAccountApplication(
    payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot("student-account-application"),
      payload,
    );
  }
}
