import { LoggerService } from "../logger/logger.service";
import { Connection, Repository } from "typeorm";
import { BaseModel } from "./entities/base.model";
import { RecordDataModel } from "./entities/record.model";


export class DataModelService<DataModel extends BaseModel>  {
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

  async findById(id: number) {
    return this.repo.findByIds([id]);
  }
}

export class RecordDataModelService<
  DataModel extends RecordDataModel
> extends DataModelService<DataModel> {}
