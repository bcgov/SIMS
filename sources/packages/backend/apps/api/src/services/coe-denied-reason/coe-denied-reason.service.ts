import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  COEDeniedReason,
  OfferingIntensity,
} from "@sims/sims-db";
import { DataSource, IsNull } from "typeorm";

@Injectable()
export class COEDeniedReasonService extends RecordDataModelService<COEDeniedReason> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(COEDeniedReason));
  }

  /**
   * List of possible COE denied reasons.
   * @param offeringIntensity Used to filter the denied reasons based on offering intensity.
   * @returns List of COE denied reasons, active, generic, intensity specific ones.
   */
  async getCOEDeniedReasons(
    intensity: OfferingIntensity,
  ): Promise<COEDeniedReason[]> {
    return this.repo.find({
      select: { id: true, reason: true },
      where: [
        { isActive: true, offeringIntensity: IsNull() },
        { isActive: true, offeringIntensity: intensity },
      ],
      order: { id: "DESC" },
    });
  }
}
