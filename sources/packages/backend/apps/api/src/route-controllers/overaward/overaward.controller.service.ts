import { Injectable } from "@nestjs/common";
import { DisbursementOverawardService } from "@sims/services";
import { getUserFullName } from "../../utilities";
import {
  OverawardDetailsAPIOutDTO,
  OverawardBalanceAPIOutDTO,
  StudentsOverawardAPIOutDTO,
} from "./models/overaward.dto";

/**
 * Overaward controller service.
 */
@Injectable()
export class OverawardControllerService {
  constructor(
    private readonly disbursementOverawardService: DisbursementOverawardService,
  ) {}

  /**
   * Get the overaward balance of a student.
   * @param studentId student.
   * @returns overaward balance for student.
   */
  async getOverawardBalance(
    studentId: number,
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
    studentId: number,
    options?: { audit: boolean },
  ): Promise<OverawardDetailsAPIOutDTO[] | StudentsOverawardAPIOutDTO[]> {
    const overawards =
      await this.disbursementOverawardService.getOverawardsByStudent(studentId);
    return overawards.map((overaward) => ({
      dateAdded: overaward.addedDate,
      createdAt: overaward.createdAt,
      overawardOrigin: overaward.originType,
      awardValueCode: overaward.disbursementValueCode,
      overawardValue: overaward.overawardValue,
      addedByUser: options?.audit
        ? getUserFullName(overaward.addedBy)
        : undefined,
      applicationNumber:
        overaward.studentAssessment?.application.applicationNumber,
      assessmentTriggerType: overaward.studentAssessment?.triggerType,
    }));
  }
}
