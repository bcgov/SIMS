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
}
