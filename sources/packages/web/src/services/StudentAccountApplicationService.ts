import ApiClient from "@/services/http/ApiClient";
import {
  CreateStudentAccountApplicationAPIInDTO,
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "@/services/http/dto";

export class StudentAccountApplicationService {
  // Share Instance
  private static instance: StudentAccountApplicationService;

  public static get shared(): StudentAccountApplicationService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Create a new student account application to be reviewed by
   * the Ministry to confirm the student's basic BCeID identity.
   * @param payload information to be assessed by the Ministry.
   * @returns student account application created id.
   */
  async createStudentAccountApplication(
    payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<void> {
    await ApiClient.StudentAccountApplicationApi.createStudentAccountApplication(
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
    return await ApiClient.StudentAccountApplicationApi.getPendingStudentAccountApplications();
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
    return await ApiClient.StudentAccountApplicationApi.getStudentAccountApplicationById(
      id,
    );
  }
}
