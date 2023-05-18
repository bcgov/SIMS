import { Injectable } from "@nestjs/common";
import { InstitutionLocation, RecordDataModelService } from "@sims/sims-db";
import { DataSource } from "typeorm";

/**
 * Institution location service.
 */
@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(InstitutionLocation));
  }

  /**
   * Get all the institution codes of the institutions who
   * are enabled for integration.
   * @returns institution codes.
   */
  async getAllIntegrationEnabledInstitutionCodes(): Promise<string[]> {
    const locations = await this.repo.find({
      select: {
        id: true,
        institutionCode: true,
      },
      where: {
        hasIntegration: true,
      },
    });
    return locations.map((location) => location.institutionCode);
  }
}
