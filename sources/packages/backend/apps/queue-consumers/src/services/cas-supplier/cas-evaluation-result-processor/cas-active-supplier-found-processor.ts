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
import { CASService } from "@sims/integrations/cas";

/**
 * Process the active supplier information found on CAS.
 */
@Injectable()
export class CASActiveSupplierFoundProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    private readonly casService: CASService,
  ) {
    super();
  }

  /**
   * Update student supplier based on the supplier information found on CAS.
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
    if (evaluationResult.status !== CASEvaluationStatus.ActiveSupplierFound) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info("Active CAS supplier found.");
    try {
      const address = studentSupplier.address;
      const result = await this.casService.createExistingSupplierSite({
        supplierNumber: evaluationResult.activeSupplier.suppliernumber,
        supplierSite: {
          addressLine1: address.addressLine1,
          city: address.city,
          provinceCode: address.provinceState,
          postalCode: address.postalCode,
        },
        emailAddress: studentSupplier.email,
      });
      summary.info("Created supplier and site on CAS.");
      const [submittedAddress] = result.submittedData.SupplierAddress;
      const supplierToUpdate = evaluationResult.activeSupplier;
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const updateResult = await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          supplierNumber: result.response.supplierNumber,
          supplierName: supplierToUpdate.suppliername,
          status: supplierToUpdate.status,
          supplierProtected: supplierToUpdate.supplierprotected === "Y",
          lastUpdated: new Date(supplierToUpdate.lastupdated),
          supplierAddress: {
            supplierSiteCode: result.response.supplierSiteCode,
            addressLine1: submittedAddress.AddressLine1,
            city: submittedAddress.City,
            provinceState: submittedAddress.Province,
            country: submittedAddress.Country,
            postalCode: submittedAddress.PostalCode,
            status: "ACTIVE",
            lastUpdated: now,
          },
          supplierStatus: SupplierStatus.Verified,
          supplierStatusUpdatedOn: now,
          isValid: true,
          updatedAt: now,
          modifier: systemUser,
        },
      );
      if (updateResult.affected) {
        summary.info("Updated CAS supplier and site for the student.");
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
