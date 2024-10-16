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
import {
  CASAuthDetails,
  CASService,
  CreateSupplierAndSiteResponse,
} from "@sims/integrations/cas";

@Injectable()
export class CASActiveSupplierNotFoundProcessor extends CASEvaluationResultProcessor {
  constructor(
    private readonly casService: CASService,
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
    auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<boolean> {
    if (evaluationResult.status !== CASEvaluationStatus.NotFound) {
      throw new Error("Incorrect CAS evaluation result processor selected.");
    }
    summary.info(
      `No active CAS supplier found for supplier ID ${casSupplier.id}. Reason: ${evaluationResult.reason}.`,
    );
    let result: CreateSupplierAndSiteResponse;
    try {
      const address = casSupplier.student.contactInfo.address;
      result = await this.casService.createSupplierAndSite(auth.access_token, {
        firstName: casSupplier.student.user.firstName,
        lastName: casSupplier.student.user.lastName,
        sin: casSupplier.student.sinValidation.sin,
        emailAddress: casSupplier.student.user.email,
        supplierSite: {
          addressLine1: address.addressLine1,
          city: address.city,
          provinceCode: address.provinceState,
          postalCode: address.postalCode,
        },
      });
      summary.info(
        `Created supplier and site on CAS for supplier ID ${casSupplier.id}.`,
      );
    } catch (error: unknown) {
      summary.error("Error while creating supplier and site on CAS.", error);
      return false;
    }
    try {
      const [submittedAddress] = result.submittedData.SupplierAddress;
      const now = new Date();
      const systemUser = this.systemUsersService.systemUser;
      const updateResult = await this.casSupplierRepo.update(
        {
          id: casSupplier.id,
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
        return true;
      }
      summary.error(
        "The update of the CAS supplier and site for the student did not result in the expected affected rows number.",
      );
    } catch (error: unknown) {
      summary.error(
        "Unexpected error while updating supplier and site for the student.",
        error,
      );
      return false;
    }
  }
}