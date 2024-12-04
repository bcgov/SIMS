import { Injectable } from "@nestjs/common";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
import { CASEvaluationResultProcessor, ProcessorResult } from ".";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier } from "@sims/sims-db";
import { Repository } from "typeorm";
import { SystemUsersService } from "@sims/services";

/**
 * Assert the student can be added to CAS.
 */
@Injectable()
export class CASKnownErrorsProcessor extends CASEvaluationResultProcessor {
  constructor(
    @InjectRepository(CASSupplier)
    casSupplierRepo: Repository<CASSupplier>,
    private readonly systemUsersService: SystemUsersService,
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
    if (evaluationResult.status !== CASEvaluationStatus.KnownErrors) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info("Known CAS Errors found.");
    const processErrors = await this.processBadRequestErrors(
      studentSupplier,
      summary,
      evaluationResult.knownErrors,
      this.systemUsersService.systemUser.id,
    );
    summary.info("Updated CAS supplier errors.");
    return processErrors;
  }
}
