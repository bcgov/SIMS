import { Injectable } from "@nestjs/common";
import { StudentService } from "../../services";
import { DisbursementOverawardService } from "@sims/services";
import { DisbursementOveraward } from "@sims/sims-db";
import { OverawardBalanceAPIOutDTO } from "./models/overaward.dto";

/**
 * Overaward controller service.
 */
@Injectable()
export class OverAwardControllerService {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
  ) {}

  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  async getOverawardBalance(
    studentId?: number,
  ): Promise<OverawardBalanceAPIOutDTO> {
    const overawardBalance =
      await this.disbursementOverawardService.getOverawardBalance([studentId]);

    return { overawardBalanceValues: overawardBalance[studentId] };
  }

  /**
   * Get all overawards which belong to a student.
   * @param studentId student.
   * @returns overaward details of a student.
   */
  async getOverawardsByStudent(
    studentId?: number,
  ): Promise<DisbursementOveraward[]> {
    return this.disbursementOverawardService.getOverawardsByStudent(studentId);
  }
}
