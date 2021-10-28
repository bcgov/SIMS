import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Restriction } from "../../database/entities";
import { Connection } from "typeorm";

/**
 * Service layer for Restriction
 */
@Injectable()
export class RestrictionService extends RecordDataModelService<Restriction> {
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(Restriction));
  }
}
