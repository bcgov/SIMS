import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierAddress, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
} from "../cas-supplier.models";
import { Repository } from "typeorm";
import { CASEvaluationResultProcessor } from "./cas-evaluation-result-processor";
import { CASAuthDetails } from "@sims/integrations/cas";

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
   * Updates supplier if finds an item from the response with an active address.
   * @param casFoundSupplierResult CAS supplier response.
   * @param casSuppliers pending CAS suppliers.
   * @param summary log summary.
   * @returns true if updated a record.
   */
  async process(
    casSupplier: CASSupplier,
    evaluationResult: CASEvaluationResult,
    _auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<boolean> {
    if (evaluationResult.status !== CASEvaluationStatus.ActiveSupplierFound) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info(
      `Active CAS supplier found for supplier ID ${casSupplier.id}.`,
    );
    try {
      const supplierToUpdate = evaluationResult.activeSupplier;
      let supplierAddressToUpdate: SupplierAddress = null;
      if (evaluationResult.activeSites.length) {
        const [activeSupplierAddress] = evaluationResult.activeSites;
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
      const updateResult = await this.casSupplierRepo.update(
        {
          id: casSupplier.id,
        },
        {
          supplierNumber: supplierToUpdate.suppliernumber,
          supplierName: supplierToUpdate.suppliername,
          status: supplierToUpdate.status,
          supplierProtected: supplierToUpdate.supplierprotected === "Y",
          lastUpdated: new Date(supplierToUpdate.lastupdated),
          supplierAddress: supplierAddressToUpdate,
          supplierStatus: SupplierStatus.Verified,
          supplierStatusUpdatedOn: now,
          isValid: !!supplierAddressToUpdate,
          updatedAt: now,
          modifier: systemUser,
        },
      );
      if (updateResult.affected) {
        summary.info("Updated CAS supplier for the student.");
        return true;
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
    return false;
  }
}