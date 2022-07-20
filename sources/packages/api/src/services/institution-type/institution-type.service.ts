import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionType } from "../../database/entities/institution-type.model";
import { DataSource } from "typeorm";

/**
 * Service layer for Institution type
 */
@Injectable()
export class InstitutionTypeService extends RecordDataModelService<InstitutionType> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(InstitutionType));
  }

  /**
   * Get the institution type by primary key.
   * @param id Location id.
   * @returns Location retrieved, if found, otherwise returns null.
   */
  async getById(id: number): Promise<InstitutionType> {
    return this.repo.findOne({ where: { id } });
  }

  /**
   * Get all Institution type
   * @returns Array of InstitutionType
   */
  async getAll(): Promise<Partial<InstitutionType>[]> {
    return this.repo.find();
  }

  /**
   * Get institution type by name
   * @param name Institution type name
   * @returns InstitutionType object
   */
  async getInstitutionTypeByName(name: string): Promise<InstitutionType> {
    return this.repo.findOne({ where: { name } });
  }
}
