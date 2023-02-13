import HttpBaseClient from "@/services/http/common/HttpBaseClient";
import { OverawardBalanceAPIOutDTO } from "@/services/http/dto";

/**
 * Http API client for Overaward.
 */
export class OverawardApi extends HttpBaseClient {
  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  async getOverawardBalance(
    studentId?: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    const overawardBalanceURL = studentId
      ? `overaward/student/${studentId}/balance`
      : "overaward/balance";
    return this.getCall<OverawardBalanceAPIOutDTO>(
      this.addClientRoot(overawardBalanceURL),
    );
  }
}
