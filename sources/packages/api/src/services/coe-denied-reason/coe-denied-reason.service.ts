import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection } from "typeorm";
import { COEDeniedReason } from "../../database/entities/coe-denied-reason.model";

@Injectable()
export class COEDeniedReasonService extends RecordDataModelService<COEDeniedReason> {
  constructor(connection: Connection) {
    super(connection.getRepository(COEDeniedReason));
  }

  async getCOEDeniedReasons(): Promise<COEDeniedReason[]> {
    return this.repo
      .createQueryBuilder("coeDeniedReason")
      .where("coeDeniedReason.isActive = :isActive", { isActive: true })
      .orderBy("coeDeniedReason.id", "DESC")
      .getMany();
  }
}
