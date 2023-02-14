import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DisbursementSchedule, DisbursementValueType } from "@sims/sims-db";
import { Repository } from "typeorm";
import {
  Award,
  MaxTuitionRemittanceTypes,
  OfferingCosts,
} from "./models/confirmation-of-enrollment.models";

/**
 * Types of awards considered for the max tuition remittance calculation.
 */
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
   * @returns maximum estimated tuition remittance if any, otherwise null.
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

  /**
   * Calculate the max tuition remittance for a disbursement.
   * @param awards awards that will be disbursed.
   * @param offeringCosts offering costs to be considered.
   * @param calculationType effective or estimated calculation.
   * Before the disbursement happen, the value for the max tuition
   * remittance can only be estimated. It is because the real values,
   * with all possible deductions, will be known only upon e-Cert
   * generation. Once the disbursement(e-Cert creation) happen,
   * the effective value for every award will be persisted and the
   * maximum tuition remittance would be known.
   * @returns max tuition remittance for a disbursement.
   */
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
      // Use the values calculated upon disbursement (e-Cert generation).
      totalAwards = tuitionAwards.reduce(
        (total, award) => total + (award.effectiveAmount ?? 0),
        0,
      );
    } else {
      // Estimate the max tuition base in what is known before disbursement (e-Cert generation).
      totalAwards = tuitionAwards.reduce(
        (total, award) =>
          total + award.valueAmount - (award.disbursedAmountSubtracted ?? 0),
        0,
      );
    }
    const offeringTotalCosts =
      offeringCosts.actualTuitionCosts + offeringCosts.programRelatedCosts;
    return Math.min(offeringTotalCosts, totalAwards);
  }
}
