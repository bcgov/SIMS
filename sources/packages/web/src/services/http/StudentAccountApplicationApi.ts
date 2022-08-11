import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  CreateStudentAccountApplicationAPIInDTO,
  StudentAccountApplicationAPIOutDTO,
  AESTStudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationApprovalAPIInDTO,
  StudentAccountApplicationSummaryAPIOutDTO,
} from "@/services/http/dto";

export class StudentAccountApplicationApi extends HttpBaseClient {
  /**
   * Create a new student account application to be reviewed by
   * the Ministry to confirm the student's basic BCeID identity.
   * @param payload information to be assessed by the Ministry.
   */
  async createStudentAccountApplication(
    payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<void> {
    try {
      await this.postCall(
        this.addClientRoot("student-account-application"),
        payload,
      );
    } catch (error: unknown) {
      this.handleAPICustomError(error);
    }
  }

  /**
   * Get the summary list of all student account applications
   * waiting to be assessed by the Ministry.
   * @returns summary list of pending student account applications.
   */
  async getPendingStudentAccountApplications(): Promise<
    StudentAccountApplicationSummaryAPIOutDTO[]
  > {
    return this.getCallTyped<StudentAccountApplicationSummaryAPIOutDTO[]>(
      this.addClientRoot("student-account-application/pending"),
    );
  }

  /**
   * Get the student account application previously submitted
   * by the student for the basic BCeID student account creation.
   * @param studentAccountApplicationId student account application id.
   * @returns student account application.
   */
  async getStudentAccountApplicationById(
    studentAccountApplicationId: number,
  ): Promise<AESTStudentAccountApplicationAPIOutDTO> {
    return this.getCallTyped<AESTStudentAccountApplicationAPIOutDTO>(
      this.addClientRoot(
        `student-account-application/${studentAccountApplicationId}`,
      ),
    );
  }

  /**
   * Approve the student account application associating the user
   * with a student account. The Ministry can also adjust any student
   * data that will then be used to create the student account.
   * @param studentAccountApplicationId student account application id.
   * @param payload data to approve the student account application.
   */
  async approveStudentAccountApplication(
    studentAccountApplicationId: number,
    payload: StudentAccountApplicationApprovalAPIInDTO,
  ): Promise<void> {
    await this.postCall(
      this.addClientRoot(
        `student-account-application/${studentAccountApplicationId}/approve`,
      ),
      payload,
    );
  }

  /**
   * Declines the student account application.
   * @param studentAccountApplicationId student account application id.
   */
  async declineStudentAccountApplication(
    studentAccountApplicationId: number,
  ): Promise<void> {
    await this.patchCall(
      this.addClientRoot(
        `student-account-application/${studentAccountApplicationId}/decline`,
      ),
      null,
    );
  }

  /**
   * Checks if a user has a pending student account application.
   * @returns true if there is a pending student account application
   * to be assessed by the Ministry, otherwise, false.
   */
  async hasPendingAccountApplication(): Promise<StudentAccountApplicationAPIOutDTO> {
    return this.getCallTyped(
      this.addClientRoot(
        "student-account-application/has-pending-account-application",
      ),
    );
  }
}
