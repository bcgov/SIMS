import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository } from "typeorm";
import { CASService, CASAuthDetails } from "@sims/integrations/cas";
import { CustomNamedError, isAddressFromCanada } from "@sims/utilities";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  ManualInterventionReason,
  NotFoundReason,
} from "./cas-supplier.models";
import {
  CASActiveSupplierNotFoundProcessor,
  CASManualInterventionProcessor,
  CASActiveSupplierFoundProcessor,
  CASEvaluationResultProcessor,
} from "./cas-evaluation-result-processor";

@Injectable()
export class CASSupplierIntegrationService {
  constructor(
    private readonly casService: CASService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    private readonly casManualInterventionProcessor: CASManualInterventionProcessor,
    private readonly casActiveSupplierFoundProcessor: CASActiveSupplierFoundProcessor,
    private readonly casActiveSupplierNotFoundProcessor: CASActiveSupplierNotFoundProcessor,
  ) {}

  /**
   * CAS integration process.
   * Logs on CAS supplier API and request the supplier information for the students with pending supplier information.
   * @param parentProcessSummary parent process summary.
   * @param casSuppliers pending CAS suppliers.
   * @returns a number of update records.
   */
  async executeCASIntegrationProcess(
    parentProcessSummary: ProcessSummary,
    casSuppliers: CASSupplier[],
  ): Promise<number> {
    let suppliersUpdated = 0;
    const summary = new ProcessSummary();
    parentProcessSummary.children(summary);
    try {
      summary.info("Logging on CAS.");
      const auth = await this.casService.logon();
      summary.info("Logon successful.");
      suppliersUpdated = await this.processSuppliers(
        casSuppliers,
        summary,
        auth,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError && error.name === CAS_AUTH_ERROR) {
        summary.error(error.message);
      } else {
        summary.error("Unexpected error.", error);
      }
    }
    return suppliersUpdated;
  }

  /**
   * For each pending CAS supplier, request supplier information to CAS API and update local table.
   * @param casSuppliers pending CAS suppliers.
   * @param parentProcessSummary parent log summary.
   * @param auth CAS auth details.
   * @returns true if updated a record.
   */
  private async processSuppliers(
    casSuppliers: CASSupplier[],
    parentProcessSummary: ProcessSummary,
    auth: CASAuthDetails,
  ): Promise<number> {
    let suppliersUpdated = 0;
    for (const casSupplier of casSuppliers) {
      const summary = new ProcessSummary();
      parentProcessSummary.children(summary);
      const evaluationResult = await this.evaluateCASSupplier(
        casSupplier,
        auth,
      );
      let processor: CASEvaluationResultProcessor;
      summary.info(`CAS evaluation result status: ${evaluationResult.status}.`);
      switch (evaluationResult.status) {
        case CASEvaluationStatus.ManualInterventionRequired:
          processor = this.casManualInterventionProcessor;
          break;
        case CASEvaluationStatus.ActiveSupplierFound:
          processor = this.casActiveSupplierFoundProcessor;
          break;
        case CASEvaluationStatus.NotFound:
          processor = this.casActiveSupplierNotFoundProcessor;
          break;
        default:
          summary.error(`Unexpected CAS evaluation result status.`);
          continue;
      }
      const supplierUpdated = await processor.process(
        casSupplier,
        evaluationResult,
        auth,
        summary,
      );
      if (supplierUpdated) {
        suppliersUpdated++;
      }
    }
    return suppliersUpdated;
  }

  private async evaluateCASSupplier(
    casSupplier: CASSupplier,
    auth: CASAuthDetails,
  ): Promise<CASEvaluationResult> {
    if (!casSupplier.student.user.firstName) {
      return {
        status: CASEvaluationStatus.ManualInterventionRequired,
        reason: ManualInterventionReason.GivenNamesNotPresent,
      };
    }
    if (!isAddressFromCanada(casSupplier.student.contactInfo.address)) {
      return {
        status: CASEvaluationStatus.ManualInterventionRequired,
        reason: ManualInterventionReason.NonCanadianAddress,
      };
    }
    const supplierResponse = await this.casService.getSupplierInfoFromCAS(
      auth.access_token,
      casSupplier.student.sinValidation.sin,
      casSupplier.student.user.lastName,
    );
    if (!supplierResponse.items.length) {
      return {
        status: CASEvaluationStatus.NotFound,
        reason: NotFoundReason.SupplierNotFound,
      };
    }
    // Check if there is at least one active supplier.
    const casResponseActiveSupplier = supplierResponse.items.find(
      (supplier) => supplier.status === "ACTIVE",
    );
    if (!casResponseActiveSupplier) {
      return {
        status: CASEvaluationStatus.NotFound,
        reason: NotFoundReason.NoActiveSupplierFound,
      };
    }
    // Get the list of all active addresses.
    const casResponseActiveAddresses =
      casResponseActiveSupplier.supplieraddress?.filter(
        (address) => address.status === "ACTIVE",
      ) ?? [];
    return {
      status: CASEvaluationStatus.ActiveSupplierFound,
      activeSupplier: casResponseActiveSupplier,
      activeSites: casResponseActiveAddresses,
    };
  }

  /**
   * Gets a list of CAS suppliers to be updated from CAS supplier table.
   * @returns a list of CAS suppliers to be updated.
   */
  async getStudentsToUpdateSupplierInformation(): Promise<CASSupplier[]> {
    return this.casSupplierRepo.find({
      select: {
        id: true,
        student: {
          id: true,
          sinValidation: { sin: true },
          user: { firstName: true, lastName: true },
          contactInfo: true as unknown,
        },
      },
      relations: {
        student: { sinValidation: true, user: true },
      },
      where: {
        isValid: false,
        supplierStatus: SupplierStatus.PendingSupplierVerification,
        student: { sinValidation: { isValidSIN: true } },
      },
    });
  }
}
