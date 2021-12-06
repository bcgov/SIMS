import { Connection, Repository } from "typeorm";
import { RecordDataModel } from "./entities/record.model";

export class DataModelService<DataModel> {
  static getRepo<DataModel>(
    connection: Connection,
    entity: Function,
  ): Repository<DataModel> {
    return connection.getRepository(entity) as Repository<DataModel>;
  }

  constructor(protected repo: Repository<DataModel>) {}

  create(): DataModel {
    return this.repo.create() as DataModel;
  }

  async save(object: DataModel) {
    return this.repo.manager.save(object);
  }

  async remove(object) {
    return this.repo.remove([object]);
  }

  /**
   * Tries to find an entity by its id.
   * @param id entity id to be find.
   * @returns Entity found, otherwise null.
   */
  async findById(id: number): Promise<DataModel | null> {
    const result = await this.repo.findByIds([id]);
    if (result?.length === 1) {
      return result[0];
    }

    return null;
  }
}

export class RecordDataModelService<
  DataModel extends RecordDataModel,
> extends DataModelService<DataModel> {}
