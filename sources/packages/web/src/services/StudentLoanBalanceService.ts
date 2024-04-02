import ApiClient from "@/services/http/ApiClient";
import { StudentLoanBalanceAPIOutDTO } from "@/services/http/dto";

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
   * Get loan balance details of
   * the given student up to essential recent records received.
   * @param studentId student.
   * @returns student loan balance.
   */
  async getStudentLoanBalance(
    studentId: number,
  ): Promise<StudentLoanBalanceAPIOutDTO> {
    return ApiClient.StudentLoanBalanceApi.getStudentLoanBalance(studentId);
  }
}
