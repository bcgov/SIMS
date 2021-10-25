import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Restriction } from "../../database/entities";
import { Connection } from "typeorm";

/**
 * Service layer for Restriction
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(Restriction));
  }

  /**
   * Get the restriction by primary key.
   * @param id Restriction id.
   * @returns Restriction retrieved, if found, otherwise returns null.
   */
  async getById(id: number): Promise<Restriction> {
    return this.repo.findOne(id);
  }

  /**
   * Get all Restrictions
   * @returns Array of Restriction
   */
  async getAll(): Promise<Partial<Restriction>[]> {
    return this.repo.find();
  }
}
