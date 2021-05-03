import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { InstitutionLocation } from "../../database/entities/institution-location.model";
import { Connection } from "typeorm";

@Injectable()
export class InstitutionLocationService extends RecordDataModelService<InstitutionLocation> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(InstitutionLocation));
  }
}
