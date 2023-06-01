import { Injectable } from "@nestjs/common";
import { DataSource, FindOptionsWhere } from "typeorm";
import { RecordDataModelService, DisbursementReceipt } from "@sims/sims-db";

/**
 * Service for disbursement receipts.
 */
@Injectable()
export class DisbursementReceiptService extends RecordDataModelService<DisbursementReceipt> {
  constructor(private readonly dataSource: DataSource) {
    super(dataSource.getRepository(DisbursementReceipt));
  }

  /**
   * Get the disbursement receipt details for
   * given assessment.
   * @param assessmentId assessment to which disbursement
   * receipt belongs to.
   * @param studentId student to whom the disbursement
   * receipt belongs to.
   * @param applicationId application id.
   * @returns disbursement receipt details.
   */
  async getDisbursementReceiptByAssessment(
    assessmentId: number,
    studentId?: number,
    applicationId?: number,
  ): Promise<DisbursementReceipt[]> {
    let findOptions: FindOptionsWhere<DisbursementReceipt> = {
      disbursementSchedule: {
        studentAssessment: {
          id: assessmentId,
          application: studentId ? { student: { id: studentId } } : undefined,
        },
      },
    };
    if (studentId && applicationId) {
      findOptions = {
        disbursementSchedule: {
          studentAssessment: {
            id: assessmentId,
            application: { student: { id: studentId }, id: applicationId },
          },
        },
      };
    }
    if (!studentId && applicationId) {
      findOptions = {
        disbursementSchedule: {
          studentAssessment: {
            id: assessmentId,
            application: { id: applicationId },
          },
        },
      };
    }

    return this.repo.find({
      select: {
        id: true,
        disbursementSchedule: { id: true },
        disbursementReceiptValues: { grantType: true, grantAmount: true },
      },
      relations: {
        disbursementReceiptValues: true,
        disbursementSchedule: true,
      },
      where: findOptions,
    });
  }
}
