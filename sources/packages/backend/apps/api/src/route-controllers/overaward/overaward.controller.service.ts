import { Injectable } from "@nestjs/common";
import { DisbursementOverawardService } from "@sims/services";
import { DisbursementOveraward } from "@sims/sims-db";
import { getUserFullName } from "../../utilities";
import {
  OverawardAPIOutDTO,
  OverawardBalanceAPIOutDTO,
} from "./models/overaward.dto";

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
   * @param includeAddedBy include added by.
   * @returns overaward details of a student.
   */
  async getOverawardsByStudent(
    studentId?: number,
    includeAddedBy = false,
  ): Promise<OverawardAPIOutDTO[]> {
    const overAwards =
      await this.disbursementOverawardService.getOverawardsByStudent(studentId);
    return overAwards.map((overaward) =>
      this.transformOverawards(overaward, includeAddedBy),
    );
  }

  /**
   * Transform overawards for a student.
   * @param overaward overaward.
   * @param includeAddedBy include added by.
   * @returns transformed overawards.
   */
  private transformOverawards(
    overaward: DisbursementOveraward,
    includeAddedBy: boolean,
  ): OverawardAPIOutDTO {
    return {
      dateAdded: overaward.addedDate,
      overawardOrigin: overaward.originType,
      awardValueCode: overaward.disbursementValueCode,
      overawardValue: overaward.overawardValue,
      addedByUser: includeAddedBy
        ? getUserFullName(overaward.addedBy)
        : undefined,
      applicationNumber:
        overaward.studentAssessment?.application.applicationNumber,
      assessmentTriggerType: overaward.studentAssessment?.triggerType,
    };
  }
}
