import { DataSource, Repository } from "typeorm";
import { RecordDataModel } from "./entities/record.model";

export class DataModelService<DataModel> {
  static getRepo<DataModel>(
    dataSource: DataSource,
    entity: any,
  ): Repository<DataModel> {
    return dataSource.getRepository(entity) as Repository<DataModel>;
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
}

export class RecordDataModelService<
  DataModel extends RecordDataModel,
> extends DataModelService<DataModel> {}
