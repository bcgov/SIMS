import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { ProcessorResult } from ".";
import { StudentSupplierToProcess } from "apps/queue-consumers/src/services/cas-supplier/cas-supplier.models";
import { Repository } from "typeorm";

@Injectable()
export class CASHandleErrorsProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {}

  /**
   * Process the errors that occurred during processing.
   * @param studentSupplier student supplier information from SIMS.
   * @param summary current process log.
   * @param error errors that occurred during processing.
   * @returns processor result.
   */
  async processErrors(
    studentSupplier: StudentSupplierToProcess,
    summary: ProcessSummary,
    error: string[],
    partialSupplier?: Partial<CASSupplier>,
  ): Promise<ProcessorResult> {
    summary.error("An error occurred during processing.", error);
    const now = new Date();
    const systemUser = this.systemUsersService.systemUser;
    try {
      await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          ...(partialSupplier ? partialSupplier : {}),
          supplierStatus: SupplierStatus.ManualIntervention,
          supplierStatusUpdatedOn: now,
          isValid: false,
          updatedAt: now,
          modifier: systemUser,
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
