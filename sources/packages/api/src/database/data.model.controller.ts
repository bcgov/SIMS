import { Connection, Repository } from "typeorm";
import { BaseModel } from "./entities/base.model";
import { RecordDataModel } from "./entities/record.model";

export class BaseDataModelController <DataModel extends BaseModel> {
  public repo: Repository<DataModel>;
  constructor(public entity: Function, public connection: Connection) {
    this.repo = connection.getRepository(entity) as Repository<DataModel>;
  }
}

export class RecordDataModelController <DataModel extends RecordDataModel> extends BaseDataModelController<DataModel> {}