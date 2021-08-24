import { Injectable, Inject } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { PirDeniedReason } from "../../database/entities/pir-denied-reason.model";

@Injectable()
export class PirDeniedReasonService extends RecordDataModelService<PirDeniedReason> {
  constructor(@Inject("Connection") private readonly connection: Connection) {
    super(connection.getRepository(PirDeniedReason));
  }

  async getPirDeniedReasons(): Promise<PirDeniedReason[]> {
    return this.repo
      .createQueryBuilder("pirDeniedReason")
      .where("pirDeniedReason.is_active = true")
      .orderBy("pirDeniedReason.id", "ASC")
      .getMany();
  }
}
