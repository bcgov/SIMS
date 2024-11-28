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
import { CASEvaluationResultProcessor, ProcessorResult } from ".";

/**
 * Process the active supplier and site information found on CAS.
 */
@Injectable()
export class CASActiveSupplierAndSiteFoundProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    super();
  }

  /**
   * Update student supplier based on the supplier and site information found on CAS.
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
    if (
      evaluationResult.status !== CASEvaluationStatus.ActiveSupplierAndSiteFound
    ) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info("Active CAS supplier and site found.");
    try {
      const address = evaluationResult.matchedAddress;
      const supplierAddressToUpdate = {
        supplierSiteCode: address.suppliersitecode,
        addressLine1: address.addressline1,
        addressLine2: address.addressline2,
        city: address.city,
        provinceState: address.province,
        country: address.country,
        postalCode: address.postalcode,
        status: address.status,
        siteProtected: address.siteprotected,
        lastUpdated: new Date(address.lastupdated),
      };
      const studentProfileSnapshot =
        this.getStudentProfileSnapshot(studentSupplier);
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const supplierToUpdate = evaluationResult.activeSupplier;
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
          supplierAddress: supplierAddressToUpdate,
          supplierStatus: SupplierStatus.Verified,
          studentProfileSnapshot,
          supplierStatusUpdatedOn: now,
          isValid: true,
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
