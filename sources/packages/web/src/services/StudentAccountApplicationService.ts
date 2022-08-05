import ApiClient from "@/services/http/ApiClient";
import { CreateStudentAccountApplicationAPIInDTO } from "@/services/http/dto";

export class StudentAccountApplicationService {
  // Share Instance
  private static instance: StudentAccountApplicationService;

  public static get shared(): StudentAccountApplicationService {
    return this.instance || (this.instance = new this());
  }

  async createStudentAccountApplication(
    payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.StudentAccountApplicationApi.createStudentAccountApplication(
      payload,
    );
  }
}
