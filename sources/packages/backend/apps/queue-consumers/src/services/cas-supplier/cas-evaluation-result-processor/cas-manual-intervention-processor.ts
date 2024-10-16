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
import { CASEvaluationResultProcessor } from "./cas-evaluation-result-processor";
import { CASAuthDetails } from "@sims/integrations/cas";

@Injectable()
export class CASManualInterventionProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    super();
  }

  async process(
    casSupplier: CASSupplier,
    evaluationResult: CASEvaluationResult,
    _auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<boolean> {
    if (
      evaluationResult.status !== CASEvaluationStatus.ManualInterventionRequired
    ) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.warn(
      `Not possible to retrieve CAS supplier information for supplier ID ${casSupplier.id} because a manual intervention is required. Reason: ${evaluationResult.reason}.`,
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
        return true;
      }
      summary.error(
        "The update of the CAS supplier for manual intervention did not result in the expected affected rows number.",
      );
    } catch (error: unknown) {
      summary.error(
        "Unexpected error while updating CAS to manual intervention for the student.",
        error,
      );
      return false;
    }
  }
}
