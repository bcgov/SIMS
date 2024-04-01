import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentLoanBalanceAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for student loan balance.
 */
export class StudentLoanBalanceApi extends HttpBaseClient {
  /**
   * Get loan balance details of
   * the given student upto essential recent records received.
   * @param studentId student.
   * @returns student loan balance.
   */
  async getStudentLoanBalance(
    studentId: number,
  ): Promise<StudentLoanBalanceAPIOutDTO> {
    return this.getCall<StudentLoanBalanceAPIOutDTO>(
      this.addClientRoot(`student-loan-balance/student/${studentId}`),
    );
  }
}
