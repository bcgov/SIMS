import ApiClient from "@/services/http/ApiClient";
import {
  OverawardAPIOutDTO,
  OverawardBalanceAPIOutDTO,
  OverawardManualRecordAPIInDTO,
} from "@/services/http/dto";

/**
 * Client service layer for Overawards.
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

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  async getStudentOverawards(
    studentId?: number,
  ): Promise<OverawardAPIOutDTO[]> {
    return ApiClient.OverawardApi.getStudentOverawards(studentId);
  }

  /**
   * Add a manual overaward for a student.
   * @param studentId student for whom overaward deduction is being added.
   * @param payload overaward payload. The overawardValue can be a negative or positive value.
   * @returns primary identifier of the resource created.
   */
  async addManualOveraward(
    studentId: number,
    payload: OverawardManualRecordAPIInDTO,
  ): Promise<void> {
    await ApiClient.OverawardApi.addManualOveraward(studentId, payload);
  }
}
