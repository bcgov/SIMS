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
import {
  CASService,
  CreateSupplierAndSiteResponse,
} from "@sims/integrations/cas";
import {
  CASEvaluationResultProcessor,
  CASHandleErrorsProcessor,
  ProcessorResult,
} from ".";

/**
 * Process a student that was not found on CAS.
 */
@Injectable()
export class CASActiveSupplierNotFoundProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly casService: CASService,
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
    private readonly casHandleErrorsProcessor: CASHandleErrorsProcessor,
  ) {
    super();
  }

  /**
   * Create the new supplier and site on CAS using the student information.
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
    if (evaluationResult.status !== CASEvaluationStatus.NotFound) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info(
      `No active CAS supplier found. Reason: ${evaluationResult.reason}.`,
    );
    let result: CreateSupplierAndSiteResponse;
    try {
      const address = studentSupplier.address;
      result = await this.casService.createSupplierAndSite({
        firstName: studentSupplier.firstName,
        lastName: studentSupplier.lastName,
        sin: studentSupplier.sin,
        emailAddress: studentSupplier.email,
        supplierSite: {
          addressLine1: address.addressLine1,
          city: address.city,
          provinceCode: address.provinceState,
          postalCode: address.postalCode,
        },
      });
      summary.info("Created supplier and site on CAS.");
    } catch (error: unknown) {
      summary.error("Error while creating supplier and site on CAS.", error);
      return await this.casHandleErrorsProcessor.processErrors(
        studentSupplier,
        summary,
        [error.toString()],
      );
    }
    try {
      const [submittedAddress] = result.submittedData.SupplierAddress;
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const updateResult = await this.casSupplierRepo.update(
        {
          id: studentSupplier.casSupplierID,
        },
        {
          supplierNumber: result.response.supplierNumber,
          supplierName: result.submittedData.SupplierName,
          status: "ACTIVE",
          lastUpdated: now,
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
        "The update of the CAS supplier and site for the student did not result in the expected affected rows number.",
      );
    } catch (error: unknown) {
      summary.error(
        "Unexpected error while updating supplier and site for the student.",
        error,
      );
    }
  }
}
