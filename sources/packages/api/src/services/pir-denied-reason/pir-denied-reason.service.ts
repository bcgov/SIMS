import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { PIRDeniedReason } from "../../database/entities/pir-denied-reason.model";

@Injectable()
export class PIRDeniedReasonService extends RecordDataModelService<PIRDeniedReason> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(PIRDeniedReason));
  }

  async getPIRDeniedReasons(): Promise<PIRDeniedReason[]> {
    return this.repo
      .createQueryBuilder("pirDeniedReason")
      .where("pirDeniedReason.isActive = true")
      .orderBy("pirDeniedReason.id", "ASC")
      .getMany();
  }
}
