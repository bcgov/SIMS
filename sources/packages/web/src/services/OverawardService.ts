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
   * Add a manual overaward deduction for a student.
   * @param studentId student for whom overaward deduction is being added.
   * @param payload overaward deduction payload.
   * @returns primary identifier of the resource created.
   */
  async addManualOverawardDeduction(
    payload: OverawardManualRecordAPIInDTO,
    studentId?: number,
  ): Promise<void> {
    // When a manual record is added, it must be added as deduction.
    // Hence overaward value her is negative value of the actual value provided.
    const payloadDeducted: OverawardManualRecordAPIInDTO = {
      awardValueCode: payload.awardValueCode,
      overawardValue: payload.overawardValue * -1,
      overawardNotes: payload.overawardNotes,
    };
    await ApiClient.OverawardApi.addManualOveraward(payloadDeducted, studentId);
  }
}
