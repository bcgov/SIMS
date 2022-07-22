import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { DataSource } from "typeorm";
import { PIRDeniedReason } from "../../database/entities/pir-denied-reason.model";

@Injectable()
export class PIRDeniedReasonService extends RecordDataModelService<PIRDeniedReason> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(PIRDeniedReason));
  }

  async getPIRDeniedReasons(): Promise<PIRDeniedReason[]> {
    return this.repo
      .createQueryBuilder("pirDeniedReason")
      .where("pirDeniedReason.isActive = true")
      .orderBy("pirDeniedReason.id", "DESC")
      .getMany();
  }
}
