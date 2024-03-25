import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { StudentMonthlyLoanBalanceAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for student loan balance.
 */
export class StudentLoanBalanceApi extends HttpBaseClient {
  /**
   * Get the monthly part-time loan balance details of
   * the given student upto 12 months.
   * @param studentId student.
   * @returns student monthly part-time loan balance.
   */
  async getStudentPartTimeLoanBalance(
    studentId: number,
  ): Promise<StudentMonthlyLoanBalanceAPIOutDTO> {
    return this.getCall<StudentMonthlyLoanBalanceAPIOutDTO>(
      this.addClientRoot(`student-loan-balance/part-time/student/${studentId}`),
    );
  }
}
