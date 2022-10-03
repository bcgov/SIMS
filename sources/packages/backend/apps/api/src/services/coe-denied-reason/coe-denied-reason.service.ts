import { Injectable } from "@nestjs/common";
import { RecordDataModelService, COEDeniedReason } from "@sims/sims-db";
import { DataSource } from "typeorm";

@Injectable()
export class COEDeniedReasonService extends RecordDataModelService<COEDeniedReason> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(COEDeniedReason));
  }

  async getCOEDeniedReasons(): Promise<COEDeniedReason[]> {
    return this.repo
      .createQueryBuilder("coeDeniedReason")
      .where("coeDeniedReason.isActive = :isActive", { isActive: true })
      .orderBy("coeDeniedReason.id", "DESC")
      .getMany();
  }
}
