import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierAddress, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository, UpdateResult } from "typeorm";
import {
  CASService,
  CASAuthDetails,
  CASSupplierResponse,
  CASSupplierResponseItem,
} from "@sims/integrations/cas";
import { CustomNamedError, isAddressFromCanada } from "@sims/utilities";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  ManualInterventionReason,
  NotFoundReason,
} from "./cas-supplier.models";

@Injectable()
export class CASSupplierIntegrationService {
  constructor(
    private readonly casService: CASService,
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {}

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
      summary.info("Logging on CAS...");
      const auth = await this.casService.logon();
      summary.info("Logon successful.");
      suppliersUpdated = await this.requestCASAndUpdateSuppliers(
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
  private async requestCASAndUpdateSuppliers(
    casSuppliers: CASSupplier[],
    parentProcessSummary: ProcessSummary,
    auth: CASAuthDetails,
  ): Promise<number> {
    let suppliersUpdated = 0;
    for (const casSupplier of casSuppliers) {
      const summary = new ProcessSummary();
      parentProcessSummary.children(summary);

      const evaluationStatus = await this.evaluateCASSupplier(
        casSupplier,
        auth,
      );
      if (
        evaluationStatus.status ===
        CASEvaluationStatus.ManualInterventionRequired
      ) {
        summary.warn(
          `Not possible to retrieve CAS supplier information for supplier ID ${casSupplier.id} because a manual intervention is required. Reason: ${evaluationStatus.reason}.`,
        );
        await this.updateCASSupplierForManualIntervention(casSupplier.id);
        continue;
      }

      if (evaluationStatus.status === CASEvaluationStatus.NotFound) {
        summary.warn(
          `No active CAS supplier found supplier ID ${casSupplier.id}.`,
        );
        // TODO: Call CAS to created new supplier.
        continue;
      }

      if (evaluationStatus.status === CASEvaluationStatus.ActiveSupplierFound) {
        summary.warn(
          `Active CAS supplier found for supplier ID ${casSupplier.id}.`,
        );
        // TODO: Process found supplier.
        // evaluationStatus.activeSite
        // evaluationStatus.activeSupplier
        // Can we save the active supplier if it has an inactive site?
        // Should we keep saving only if it has active supplier and one active address?
        // Can we save the active supplier, set is valid to false and set the status as "Pending address verification"?
      }

      // TODO: refactor below code.
      // Query CAS API to check if the supplier exists.
      summary.info(`Requesting info for CAS supplier ID ${casSupplier.id}.`);
      try {
        const supplierResponse = await this.casService.getSupplierInfoFromCAS(
          auth.access_token,
          casSupplier.student.sinValidation.sin,
          casSupplier.student.user.lastName,
        );
        if (await this.updateSupplier(supplierResponse, summary, casSupplier)) {
          suppliersUpdated++;
        }
      } catch (error: unknown) {
        summary.error(
          "Error while requesting or updating CAS suppliers.",
          error,
        );
      }
    }
    return suppliersUpdated;
  }

  /**
   * Updates supplier if finds an item from the response with an active address.
   * @param supplierResponse CAS supplier response.
   * @param summary log summary.
   * @param casSuppliers pending CAS suppliers.
   * @returns true if updated a record.
   */
  private async updateSupplier(
    supplierResponse: CASSupplierResponse,
    summary: ProcessSummary,
    casSupplier: CASSupplier,
  ): Promise<boolean> {
    if (!supplierResponse.items.length) {
      summary.info("No supplier found on CAS.");
      return false;
    } else {
      const [supplierInfo] = supplierResponse.items;
      const activeSupplierItemAddress =
        this.getActiveSupplierItemAddress(supplierInfo);
      if (activeSupplierItemAddress) {
        summary.info("Updating CAS supplier table.");
        try {
          const updateResult = await this.updateCASSupplier(
            casSupplier.id,
            supplierInfo,
            SupplierStatus.Verified,
          );
          if (updateResult.affected) {
            return true;
          }
        } catch (error: unknown) {
          throw new Error(
            "Unexpected error while updating CAS supplier table.",
            error,
          );
        }
      } else {
        summary.info("No active supplier address found on CAS.");
      }
    }
    return false;
  }

  /**
   * Updates CAS supplier table.
   * @param casSupplierId CAS supplier id to be updated.
   * @param casSupplierResponseItem CAS supplier response item from CAS request.
   * @param supplierStatus CAS supplier status to be updated.
   * @returns update result.
   */
  async updateCASSupplier(
    casSupplierId: number,
    casSupplierResponseItem: CASSupplierResponseItem,
    supplierStatus: SupplierStatus,
  ): Promise<UpdateResult> {
    // When multiple exists, only the active one should be saved.
    // We will not be saving the array received at this moment, only a single entry from the received list should be persisted as JSONB.
    const activeSupplierAddress = this.getActiveSupplierItemAddress(
      casSupplierResponseItem,
    );
    let supplierAddressToUpdate: SupplierAddress = null;
    if (activeSupplierAddress) {
      supplierAddressToUpdate = {
        supplierSiteCode: activeSupplierAddress.suppliersitecode,
        addressLine1: activeSupplierAddress.addressline1,
        addressLine2: activeSupplierAddress.addressline2,
        city: activeSupplierAddress.city,
        provinceState: activeSupplierAddress.province,
        country: activeSupplierAddress.country,
        postalCode: activeSupplierAddress.postalcode,
        status: activeSupplierAddress.status,
        siteProtected: activeSupplierAddress.siteprotected,
        lastUpdated: new Date(activeSupplierAddress.lastupdated),
      };
    }
    const now = new Date();
    const systemUser = this.systemUsersService.systemUser;
    return this.casSupplierRepo.update(
      {
        id: casSupplierId,
      },
      {
        supplierNumber: casSupplierResponseItem.suppliernumber,
        supplierName: casSupplierResponseItem.suppliername,
        status: casSupplierResponseItem.status,
        supplierProtected: casSupplierResponseItem.supplierprotected === "Y",
        lastUpdated: new Date(casSupplierResponseItem.lastupdated),
        supplierAddress: supplierAddressToUpdate,
        supplierStatus,
        supplierStatusUpdatedOn: now,
        isValid: true,
        updatedAt: now,
        modifier: systemUser,
      },
    );
  }

  async updateCASSupplierForManualIntervention(
    casSupplierId: number,
  ): Promise<UpdateResult> {
    const now = new Date();
    const systemUser = this.systemUsersService.systemUser;
    return this.casSupplierRepo.update(
      {
        id: casSupplierId,
      },
      {
        supplierStatus: SupplierStatus.ManualIntervention,
        supplierStatusUpdatedOn: now,
        isValid: false,
        updatedAt: now,
        modifier: systemUser,
      },
    );
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
          user: { lastName: true },
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
