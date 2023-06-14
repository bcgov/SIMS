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
   * Get all the institution codes of the institutions who
   * are enabled for integration.
   * @returns institution codes.
   */
  async getAllIntegrationEnabledInstitutionCodes(): Promise<string[]> {
    const locations = await this.institutionLocationRepo.find({
      select: {
        institutionCode: true,
      },
      where: {
        hasIntegration: true,
      },
    });
    return locations.map((location) => location.institutionCode);
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
