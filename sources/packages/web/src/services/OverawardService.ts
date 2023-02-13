import ApiClient from "@/services/http/ApiClient";
import { OverawardBalanceAPIOutDTO } from "@/services/http/dto";

/**
 * Client service layer for Student Assessments.
 */
export class OverawardService {
  // Shared Instance
  private static instance: OverawardService;

  static get shared(): OverawardService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  async getOverawardBalance(
    studentId?: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    return ApiClient.OverawardApi.getOverawardBalance(studentId);
  }
}
