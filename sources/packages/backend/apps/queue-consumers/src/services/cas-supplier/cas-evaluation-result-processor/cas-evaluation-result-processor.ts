import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
import { ProcessorResult } from ".";
import { CASSupplier, SupplierStatus, User } from "@sims/sims-db";
import { Repository } from "typeorm";

/**
 * Process the result of a student evaluation to determine what
 * should be execute to ensure this student will have a CAS
 * supplier and a site code associated.
 */
export abstract class CASEvaluationResultProcessor {
  constructor(protected readonly casSupplierRepo: Repository<CASSupplier>) {}
  /**
   * When implemented in a derived class, execute the process
   * to associate a CAS supplier and a site code to a student.
   * @param studentSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  abstract process(
    studentSupplier: StudentSupplierToProcess,
    evaluationResult: CASEvaluationResult,
    summary: ProcessSummary,
  ): Promise<ProcessorResult>;

  /**
   * Process the errors that occurred during processing.
   * @param studentSupplier student supplier information from SIMS.
   * @param summary current process log.
   * @param error errors that occurred during processing.
   * @param partialSupplier partial supplier information.ß
   * @returns processor result.
   */
  async processBadRequestErrors(
    studentSupplier: StudentSupplierToProcess,
    summary: ProcessSummary,
    error: string[],
    auditUserId: number,
  ): Promise<ProcessorResult> {
    summary.warn("A known error occurred during processing.");
    const now = new Date();
    const auditUser = { id: auditUserId } as User;
    try {
      await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          supplierStatus: SupplierStatus.ManualIntervention,
          supplierStatusUpdatedOn: now,
          isValid: false,
          updatedAt: now,
          modifier: auditUser,
          errors: error,
        },
      );
      summary.info("Set supplier status to Manual Intervention due to error.");
    } catch (updateError: unknown) {
      summary.error(
        "Failed to update supplier status to Manual Intervention.",
        updateError,
      );
    }
    return { isSupplierUpdated: false };
  }
}
