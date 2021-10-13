import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { RecordDataModelService } from "../../database/data.model.service";
import { SupportingUser } from "../../database/entities";

@Injectable()
export class SupportingUserService extends RecordDataModelService<SupportingUser> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SupportingUser));
  }
}
