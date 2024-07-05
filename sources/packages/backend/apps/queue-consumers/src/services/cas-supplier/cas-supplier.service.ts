import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { CASSupplier, SupplierStatus } from "@sims/sims-db";
import { Repository } from "typeorm";

@Injectable()
export class CASSupplierIntegrationService {
  constructor(
    @InjectRepository(CASSupplier)
    private readonly casSupplierRepo: Repository<CASSupplier>,
  ) {}

  /**
   *
   */
  async executeCASIntegrationProcess(): Promise<CASSupplier> {
    return {} as CASSupplier;
  }

  async getStudentsToUpdateSupplierInformation(): Promise<CASSupplier> {
    return this.casSupplierRepo.findOne({
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
        isValid: true,
        supplierStatus: SupplierStatus.PendingSupplierVerification,
        student: { sinValidation: { isValidSIN: true } },
      },
    });
  }
}
