import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import {
  CreateStudentAccountApplicationAPIInDTO,
  HasPendingStudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationAPIOutDTO,
  StudentAccountApplicationApprovalAPIInDTO,
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
   * @param studentAccountApplicationId student account application id.
   * @returns student account application.
   */
  async getStudentAccountApplicationById(
    studentAccountApplicationId: number,
  ): Promise<StudentAccountApplicationAPIOutDTO> {
    return await this.getCallTyped<StudentAccountApplicationAPIOutDTO>(
      this.addClientRoot(
        `student-account-application/${studentAccountApplicationId}`,
      ),
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
    await this.postCall(
      this.addClientRoot(
        `student-account-application/${studentAccountApplicationId}/approve`,
      ),
      payload,
    );
  }

  /**
   * Declines the student account application.
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
   * Checks is a user has a pending student account application.
   * @returns true if there is a pending student account application
   * to be assessed by the Ministry, otherwise, false.
   */
  async hasPendingAccountApplication(): Promise<HasPendingStudentAccountApplicationAPIOutDTO> {
    return this.getCallTyped(
      this.addClientRoot(
        "student-account-application/has-pending-account-application",
      ),
    );
  }
}
