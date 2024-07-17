import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierAddress, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository, UpdateResult } from "typeorm";
import { CASService } from "@sims/integrations/cas/cas.service";
import { CustomNamedError } from "@sims/utilities";
import {
  CASAuthDetails,
  CASSupplierResponse,
  CASSupplierResponseItem,
  CASSupplierResponseItemAddress,
} from "@sims/integrations/cas/models/cas-supplier-response.model";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";

const CAS_SUPPLIER_ADDRESS_ACTIVE_STATUS = "ACTIVE";
const CAS_SUPPLIER_RESPONSE_ITEM_STATUS = "ACTIVE";

@Injectable()
export class CASSupplierIntegrationService {
  constructor(
    private readonly casService: CASService,
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
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
   * @returns a number of update records.
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
      summary.info(`Requesting info for CAS supplier id ${casSupplier.id}.`);
      let supplierResponse = null;
      try {
        supplierResponse = await this.casService.getSupplierInfoFromCAS(
          auth.access_token,
          casSupplier.student.sinValidation.sin,
          casSupplier.student.user.lastName.toUpperCase(),
        );
        suppliersUpdated = await this.updateSupplier(
          supplierResponse,
          summary,
          casSupplier,
          suppliersUpdated,
        );
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
   * @param suppliersUpdated
   * @returns a number of update records.
   */
  private async updateSupplier(
    supplierResponse: CASSupplierResponse,
    summary: ProcessSummary,
    casSupplier: CASSupplier,
    suppliersUpdated: number,
  ): Promise<number> {
    if (!supplierResponse.items.length) {
      summary.info("No supplier found on CAS.");
      return;
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
            suppliersUpdated++;
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
    return suppliersUpdated;
  }

  /**
   * Gets the first active supplier address from a list supplier response item.
   * @param casSupplierResponseItem CAS supplier response item.
   * @returns CAS supplier response item address.
   */
  private getActiveSupplierItemAddress(
    casSupplierResponseItem: CASSupplierResponseItem,
  ): CASSupplierResponseItemAddress {
    if (casSupplierResponseItem.status !== CAS_SUPPLIER_RESPONSE_ITEM_STATUS) {
      return undefined;
    }
    return casSupplierResponseItem.supplieraddress.find(
      (address) => address.status === CAS_SUPPLIER_ADDRESS_ACTIVE_STATUS,
    );
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
        status: CAS_SUPPLIER_ADDRESS_ACTIVE_STATUS,
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
