import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierAddress, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { Repository } from "typeorm";
import {
  CASService,
  CASAuthDetails,
  CreateSupplierAndSiteResponse,
} from "@sims/integrations/cas";
import { CustomNamedError, isAddressFromCanada } from "@sims/utilities";
import { CAS_AUTH_ERROR } from "@sims/integrations/constants";
import {
  CASEvaluationResult,
  CASEvaluationStatus,
  CASFoundSupplierResult,
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
      let supplierUpdated = false;
      switch (evaluationResult.status) {
        case CASEvaluationStatus.ManualInterventionRequired:
          summary.warn(
            `Not possible to retrieve CAS supplier information for supplier ID ${casSupplier.id} because a manual intervention is required. Reason: ${evaluationResult.reason}.`,
          );
          supplierUpdated = await this.updateCASSupplierForManualIntervention(
            casSupplier.id,
          );
          break;
        case CASEvaluationStatus.ActiveSupplierFound:
          summary.info(
            `Active CAS supplier found for supplier ID ${casSupplier.id}.`,
          );
          supplierUpdated = await this.updateCASFoundSupplier(
            casSupplier.id,
            evaluationResult,
            summary,
          );
          break;
        case CASEvaluationStatus.NotFound:
          summary.info(
            `No active CAS supplier found for supplier ID ${casSupplier.id}.`,
          );
          supplierUpdated = await this.createSupplierAndSite(
            casSupplier,
            auth,
            summary,
          );
          break;
      }
      if (supplierUpdated) {
        suppliersUpdated++;
      }
    }
    return suppliersUpdated;
  }

  private async createSupplierAndSite(
    casSupplier: CASSupplier,
    auth: CASAuthDetails,
    summary: ProcessSummary,
  ): Promise<boolean> {
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
      summary.info(
        `Updated CAS supplier and site for the student, supplier ID ${casSupplier.id}.`,
      );
      return !!updateResult.affected;
    } catch (error: unknown) {
      summary.error("Error updating supplier and site for the student.", error);
      return false;
    }
  }

  private async updateCASSupplierForManualIntervention(
    casSupplierId: number,
  ): Promise<boolean> {
    const now = new Date();
    const systemUser = this.systemUsersService.systemUser;
    const updateResult = await this.casSupplierRepo.update(
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
    return !!updateResult.affected;
  }

  /**
   * Updates supplier if finds an item from the response with an active address.
   * @param casFoundSupplierResult CAS supplier response.
   * @param casSuppliers pending CAS suppliers.
   * @param summary log summary.
   * @returns true if updated a record.
   */
  private async updateCASFoundSupplier(
    casSupplierId: number,
    casFoundSupplierResult: CASFoundSupplierResult,
    summary: ProcessSummary,
  ): Promise<boolean> {
    summary.info("Updating CAS supplier table.");
    const supplierToUpdate = casFoundSupplierResult.activeSupplier;
    let supplierAddressToUpdate: SupplierAddress = null;
    if (casFoundSupplierResult.activeSites.length) {
      const [activeSupplierAddress] = casFoundSupplierResult.activeSites;
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
        id: casSupplierId,
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
    return !!updateResult.affected;
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
