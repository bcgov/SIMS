import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { InstitutionLocation } from "@sims/sims-db";
import { Repository } from "typeorm";

/**
 * Institution location service.
 */
@Injectable()
export class InstitutionLocationService {
  constructor(
    @InjectRepository(InstitutionLocation)
    private readonly institutionLocationRepo: Repository<InstitutionLocation>,
  ) {}

  /**
   * Get integration location where institution is enabled for integration.
   * @param institutionCode institution code.
   * @returns integration location.
   */
  async getIntegrationLocation(
    institutionCode: string,
  ): Promise<InstitutionLocation> {
    return this.institutionLocationRepo.findOne({
      select: {
        id: true,
        integrationContacts: true,
      },
      where: {
        hasIntegration: true,
        institutionCode,
      },
    });
  }
}
