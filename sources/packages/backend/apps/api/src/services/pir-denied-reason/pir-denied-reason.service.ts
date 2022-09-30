import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { RecordDataModelService, PIRDeniedReason } from "@sims/sims-db";

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
