import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
} from "../cas-supplier.models";
import { Repository } from "typeorm";
import { CASEvaluationResultProcessor, ProcessorResult } from ".";
import { CASAuthDetails } from "@sims/integrations/cas";

/**
 * Assert the student can be added to CAS.
 */
@Injectable()
export class CASPreValidationsProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    super();
  }

  /**
   * Process the result of a pre-validation failed, setting
   * the student CAS supplier for manual intervention.
   * @param casSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * @param _auth authentication token needed for possible
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  async process(
    casSupplier: CASSupplier,
    evaluationResult: CASEvaluationResult,
    _auth: CASAuthDetails,
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
          id: casSupplier.id,
        },
        {
          supplierStatus: SupplierStatus.ManualIntervention,
          supplierStatusUpdatedOn: now,
          isValid: false,
          updatedAt: now,
          modifier: systemUser,
        },
      );
      if (updateResult.affected) {
        summary.info("Updated CAS supplier for manual intervention.");
        return { isSupplierUpdated: true };
      }
      summary.error(
        "The update of the CAS supplier for manual intervention did not result in the expected affected rows number.",
      );
    } catch (error: unknown) {
      summary.error(
        "Unexpected error while updating CAS to manual intervention for the student.",
        error,
      );
      return { isSupplierUpdated: false };
    }
  }
}
