import ApiClient from "@/services/http/ApiClient";
import { StudentMonthlyLoanBalanceAPIOutDTO } from "@/services/http/dto";

/**
 * Client service layer for student loan balance.
 */
export class StudentLoanBalanceService {
  // Shared Instance
  private static instance: StudentLoanBalanceService;

  static get shared(): StudentLoanBalanceService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get the monthly part-time loan balance details of
   * the given student upto 12 months.
   * @param studentId student.
   * @returns student monthly part-time loan balance.
   */
  async getStudentPartTimeLoanBalance(
    studentId: number,
  ): Promise<StudentMonthlyLoanBalanceAPIOutDTO> {
    return ApiClient.StudentLoanBalanceApi.getStudentPartTimeLoanBalance(
      studentId,
    );
  }
}
