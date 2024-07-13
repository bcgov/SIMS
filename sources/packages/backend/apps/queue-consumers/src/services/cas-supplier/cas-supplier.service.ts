import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SystemUsersService } from "@sims/services";
import { CASSupplier, SupplierAddress, SupplierStatus } from "@sims/sims-db";
import { ProcessSummary } from "@sims/utilities/logger";
import { CASSupplierResponseItem } from "../../processors/schedulers/cas-integration/models/cas-supplier-response.dto";
import { Not, Repository, UpdateResult } from "typeorm";
import { CASIntegrationConfig, ConfigService } from "@sims/utilities/config";
import { CASService } from "./cas.service";

const CAS_SUPPLIER_ADDRESS_ACTIVE_STATUS = "ACTIVE";

@Injectable()
export class CASSupplierIntegrationService {
  private readonly casIntegrationConfig: CASIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly casService: CASService,
    private readonly httpService: HttpService,
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {
    this.casIntegrationConfig = config.casIntegration;
  }

  /**
   * TODO add logs
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
      const auth = await this.casService.casLogon();
      if (auth.access_token) {
        summary.info("Logon successful.");
        for (const casSupplier of casSuppliers) {
          summary.info(
            `Requesting info for CAS supplier id ${casSupplier.id}.`,
          );
          let supplierResponse = null;
          try {
            supplierResponse = await this.casService.getSupplierInfoFromCAS(
              auth.access_token,
              casSupplier.student.sinValidation.sin,
              casSupplier.student.user.lastName.toUpperCase(),
            );
          } catch (error: unknown) {
            summary.error("Unexpected error while requesting supplier.", error);
          }
          if (supplierResponse.items.length > 0) {
            const [supplierInfo] = supplierResponse.items;
            summary.info("Updating CAS supplier table.");
            try {
              const updateResult = await this.updateCASSupplier(
                casSupplier,
                supplierInfo,
                SupplierStatus.Verified,
              );
              if (updateResult.affected) {
                suppliersUpdated++;
              }
            } catch (error: unknown) {
              summary.error("Unexpected error.", error);
            }
          } else {
            summary.info("No supplier found on CAS.");
          }
        }
      } else {
        summary.info("Could not authenticate on CAS.");
      }
    } catch (error: unknown) {
      summary.error("Unexpected error.", error);
    }
    return suppliersUpdated;
  }

  /**
   * TODO comments
   * @param casSupplier
   * @param casSupplierResponseItem
   * @param supplierStatus
   */
  async updateCASSupplier(
    casSupplier: CASSupplier,
    casSupplierResponseItem: CASSupplierResponseItem,
    supplierStatus: SupplierStatus,
  ): Promise<UpdateResult> {
    // When multiple exists, only the active one should be saved.
    // We will not be saving the array received at this moment, only a single entry from the received list should be persisted as JSONB.
    const activeSupplierAddress = casSupplierResponseItem.supplieraddress.find(
      (address) => address.status === CAS_SUPPLIER_ADDRESS_ACTIVE_STATUS,
    );
    let supplierAddressToUpdate: SupplierAddress = null;
    if (activeSupplierAddress) {
      supplierAddressToUpdate = {
        supplierSiteCode: activeSupplierAddress.suppliersitecode,
        addressLine1: activeSupplierAddress.addressline1,
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
        id: casSupplier.id,
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

  /**
   * TODO comments
   * @returns
   */
  async getStudentsToUpdateSupplierInformation(): Promise<CASSupplier[]> {
    return this.casSupplierRepo.find({
      select: {
        id: true,
        student: {
          id: true,
          sinValidation: { sin: true, isValidSIN: true },
          user: { lastName: true },
        },
      },
      relations: {
        student: { sinValidation: true, user: true },
      },
      where: {
        isValid: Not(true),
        supplierStatus: SupplierStatus.PendingSupplierVerification,
        student: { sinValidation: { isValidSIN: true } },
      },
    });
  }
}
