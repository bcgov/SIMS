import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";
import { Repository } from "typeorm";
import {
  Award,
  MaxTuitionRemittanceTypes,
  OfferingCosts,
} from "./models/confirmation-of-enrollment.models";

const TUITION_REMITTANCE_AWARD_TYPES = [
  DisbursementValueType.CanadaLoan,
  DisbursementValueType.BCLoan,
  DisbursementValueType.CanadaGrant,
];

@Injectable()
export class ConfirmationOfEnrollmentService {
  constructor(
    @InjectRepository(DisbursementSchedule)
    private readonly disbursementScheduleRepo: Repository<DisbursementSchedule>,
  ) {}

  /**
   * Get the maximum estimated tuition remittance for the provided disbursement.
   * @param disbursementId disbursement id.
   * @returns maximum estimated tuition remittance if any, otherwise
   */
  async getEstimatedMaxTuitionRemittance(
    disbursementId: number,
  ): Promise<number | null> {
    const maxTuitionRemittanceData =
      await this.disbursementScheduleRepo.findOne({
        select: {
          id: true,
          disbursementValues: {
            id: true,
            valueType: true,
            valueAmount: true,
            disbursedAmountSubtracted: true,
          },
          studentAssessment: {
            id: true,
            offering: {
              id: true,
              actualTuitionCosts: true,
              programRelatedCosts: true,
            },
          },
        },
        relations: {
          disbursementValues: true,
          studentAssessment: {
            offering: true,
          },
        },
        where: {
          id: disbursementId,
        },
      });
    if (!maxTuitionRemittanceData) {
      return null;
    }
    return this.getMaxTuitionRemittance(
      maxTuitionRemittanceData.disbursementValues,
      maxTuitionRemittanceData.studentAssessment.offering,
      MaxTuitionRemittanceTypes.Estimated,
    );
  }

  getMaxTuitionRemittance(
    awards: Award[],
    offeringCosts: OfferingCosts,
    calculationType: MaxTuitionRemittanceTypes,
  ): number {
    let totalAwards = 0;
    const tuitionAwards = awards.filter((award) =>
      TUITION_REMITTANCE_AWARD_TYPES.includes(award.valueType),
    );
    if (calculationType === MaxTuitionRemittanceTypes.Effective) {
      totalAwards = tuitionAwards.reduce(
        (total, award) => total + (award.effectiveAmount ?? 0),
        0,
      );
    } else {
      totalAwards = tuitionAwards.reduce(
        (total, award) =>
          total + award.valueAmount - (award.disbursedAmountSubtracted ?? 0),
        0,
      );
    }
    const OfferingTotalCosts =
      offeringCosts.actualTuitionCosts + offeringCosts.programRelatedCosts;

    return Math.min(OfferingTotalCosts, totalAwards);
  }
}
