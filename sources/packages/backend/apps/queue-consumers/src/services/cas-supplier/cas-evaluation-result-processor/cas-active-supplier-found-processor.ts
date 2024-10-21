import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  StudentSupplierToProcess,
} from "../cas-supplier.models";
import { Repository } from "typeorm";
import { CASAuthDetails } from "@sims/integrations/cas";
import { CASEvaluationResultProcessor, ProcessorResult } from ".";

/**
 * Process the active supplier information found on CAS.
 */
@Injectable()
export class CASActiveSupplierFoundProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    super();
  }

  /**
   * Update student supplier based on the supplier information found on CAS.
   * @param studentSupplier student supplier information from SIMS.
   * @param evaluationResult evaluation result to be processed.
   * @param _auth authentication token needed for possible
   * CAS API interactions.
   * @param summary current process log.
   * @returns processor result.
   */
  async process(
    studentSupplier: StudentSupplierToProcess,
    evaluationResult: CASEvaluationResult,
    _auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<ProcessorResult> {
    if (evaluationResult.status !== CASEvaluationStatus.ActiveSupplierFound) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info("Active CAS supplier found.");
    try {
      // TODO: Create the site, populate supplierAddress, and set isValid to true;
      const supplierToUpdate = evaluationResult.activeSupplier;
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const updateResult = await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          supplierNumber: supplierToUpdate.suppliernumber,
          supplierName: supplierToUpdate.suppliername,
          status: supplierToUpdate.status,
          supplierProtected: supplierToUpdate.supplierprotected === "Y",
          lastUpdated: new Date(supplierToUpdate.lastupdated),
          supplierAddress: null,
          supplierStatus: SupplierStatus.Verified,
          supplierStatusUpdatedOn: now,
          isValid: false,
          updatedAt: now,
          modifier: systemUser,
        },
      );
      if (updateResult.affected) {
        summary.info("Updated CAS supplier for the student.");
        return { isSupplierUpdated: true };
      }
      summary.error(
        "The update of the CAS supplier for the student did not result in the expected affected rows number.",
      );
    } catch (error: unknown) {
      summary.error(
        "Error while updating CAS supplier for the student.",
        error,
      );
    }
    return { isSupplierUpdated: false };
  }
}
