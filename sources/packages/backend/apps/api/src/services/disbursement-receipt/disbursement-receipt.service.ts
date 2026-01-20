import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  RecordDataModelService,
  DisbursementReceipt,
  OfferingIntensity,
  RECEIPT_FUNDING_TYPE_FEDERAL,
} from "@sims/sims-db";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
  CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE,
} from "@sims/services/constants";

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(DisbursementReceipt));
  }

  /**
   * Get the disbursement receipt details for
   * given assessment.
   * @param assessmentId assessment to which disbursement
   * receipt belongs to.
   * @param options options for the query:
   * - `studentId` student to whom the disbursement
   * receipt belongs to.
   * - `applicationId` application id.
   * @returns disbursement receipt details.
   */
  async getDisbursementReceiptByAssessment(
    assessmentId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<DisbursementReceipt[]> {
    return this.repo.find({
      select: {
        id: true,
        disbursementSchedule: {
          id: true,
        },
      },
      relations: {
        disbursementSchedule: true,
      },
      where: {
        disbursementSchedule: {
          studentAssessment: {
            id: assessmentId,
            application: {
              id: options?.applicationId,
              student: {
                id: options?.studentId,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get the related loan award code based in the receipt.
   * Provincial loans are not present for part-time disbursements.
   * @param fundingType defines if the receipt is for a federal or provincial
   * part of the disbursement.
   * @param offeringIntensity offering intensity associate with the assessment
   * related to the receipt.
   * @returns loan award code, if possible.
   */
  static getLoanAwardCode(
    fundingType: string,
    offeringIntensity: OfferingIntensity,
  ): "CSLF" | "BCSL" | "CSLP" | null {
    if (offeringIntensity === OfferingIntensity.fullTime) {
      return fundingType === RECEIPT_FUNDING_TYPE_FEDERAL
        ? CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE
        : BC_STUDENT_LOAN_AWARD_CODE;
    }
    if (
      offeringIntensity === OfferingIntensity.partTime &&
      fundingType === RECEIPT_FUNDING_TYPE_FEDERAL
    ) {
      return CANADA_STUDENT_LOAN_PART_TIME_AWARD_CODE;
    }
    return null;
  }
}
