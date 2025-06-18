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
   * Get integration location where @hasIntegration is true.
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

  /**
   * Get integration contacts for given institution.
   * @param institutionCode institution code.
   * @returns integration contacts.
   */
  async getIntegrationContactsByInstitutionCode(
    institutionCode: string,
  ): Promise<string[]> {
    const location = await this.institutionLocationRepo.findOne({
      select: {
        integrationContacts: true,
      },
      where: {
        institutionCode,
      },
    });
    return location.integrationContacts;
  }
}
