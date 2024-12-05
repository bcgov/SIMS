import { Injectable } from "@nestjs/common";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
import { Repository } from "typeorm";
import { CASEvaluationResultProcessor, ProcessorResult } from ".";
import { InjectRepository } from "@nestjs/typeorm";

/**
 * Assert the student can be added to CAS.
 */
@Injectable()
export class CASPreValidationsProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    casSupplierRepo: Repository<CASSupplier>,
  ) {
    super(casSupplierRepo);
  }

  /**
   * Process the result of a failed pre-validation, setting
   * the student CAS supplier for manual intervention.
   * @param studentSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * @param summary current process log.
   * @returns processor result.
   */
  async process(
    studentSupplier: StudentSupplierToProcess,
    evaluationResult: CASEvaluationResult,
    summary: ProcessSummary,
  ): Promise<ProcessorResult> {
    if (evaluationResult.status !== CASEvaluationStatus.PreValidationsFailed) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.warn(
      `Not possible to retrieve CAS supplier information because some pre-validations were not fulfilled. Reason(s): ${evaluationResult.reasons.join(
        ", ",
      )}.`,
    );
    try {
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const updateResult = await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          supplierStatus: SupplierStatus.ManualIntervention,
          supplierStatusUpdatedOn: now,
          isValid: false,
          updatedAt: now,
          modifier: systemUser,
          errors: evaluationResult.reasons,
        },
      );
      if (updateResult.affected) {
        summary.info("Updated CAS supplier for manual intervention.");
        return { isSupplierUpdated: true };
      }
      summary.error(
        `The update of the CAS supplier for ${SupplierStatus.ManualIntervention} did not result in the expected affected rows number.`,
      );
    } catch (error: unknown) {
      summary.error(
        `Unexpected error while updating CAS to ${SupplierStatus.ManualIntervention} for the student.`,
        error,
      );
      return { isSupplierUpdated: false };
    }
  }
}
