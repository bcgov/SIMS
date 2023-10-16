import { Injectable } from "@nestjs/common";
import { MoreThan, Repository } from "typeorm";
import { DisbursementValue } from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Service layer for Disbursement value.
 */
@Injectable()
export class DisbursementValueService {
  constructor(
    @InjectRepository(DisbursementValue)
    private readonly disbursementValueRepo: Repository<DisbursementValue>,
  ) {}

  /**
   * Checks if there is any partial or full award amount, that
   * was withheld due to a restriction during an e-cert generation.
   * @param disbursementScheduleId disbursement schedule id.
   * @returns true if there is any partial or full award amount, that
   * was withheld due to a restriction.
   */
  async hasAwardWithheldDueToRestriction(
    disbursementScheduleId: number,
  ): Promise<boolean> {
    return this.disbursementValueRepo.exist({
      where: {
        disbursementSchedule: {
          id: disbursementScheduleId,
        },
        restrictionAmountSubtracted: MoreThan(0),
      },
    });
  }
}
