import ApiClient from "@/services/http/ApiClient";
import {
  CreateStudentAccountApplicationAPIInDTO,
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationApprovalAPIInDTO,
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

  /**
   * Approve the student account application associating the user
   * with a student account. The Ministry can also adjust any student
   * data that will then be used to create the student account.
   * @returns new student id created as a result of the approval.
   */
  async approveStudentAccountApplication(
    studentAccountApplicationId: number,
    payload: StudentAccountApplicationApprovalAPIInDTO,
  ): Promise<void> {
    await ApiClient.StudentAccountApplicationApi.approveStudentAccountApplication(
      studentAccountApplicationId,
      payload,
    );
  }

  /**
   * Declines the student account application.
   */
  async declineStudentAccountApplication(
    studentAccountApplicationId: number,
  ): Promise<void> {
    await ApiClient.StudentAccountApplicationApi.declineStudentAccountApplication(
      studentAccountApplicationId,
    );
  }

  /**
   * Checks is a user has a pending student account application.
   * @returns true if there is a pending student account application
   * to be assessed by the Ministry, otherwise, false.
   */
  async hasPendingAccountApplication(): Promise<boolean> {
    const hasPendingAccountApplication =
      await ApiClient.StudentAccountApplicationApi.hasPendingAccountApplication();
    return hasPendingAccountApplication.hasPendingApplication;
  }
}
