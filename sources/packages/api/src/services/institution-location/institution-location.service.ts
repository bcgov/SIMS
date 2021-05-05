import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection } from "typeorm";
@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(InstitutionLocation));
  }

  /**
   * Get the institution location by ID.
   * TODO: Add restriction to the database query to ensure that the
   * the user requesting the information has access to it.
   * @param id Location id.
   * @returns Location retrieved, if found, otherwise returns null.
   */
  async getById(id: number): Promise<InstitutionLocation> {
    return await this.repo.findOne(id);
  }
}
