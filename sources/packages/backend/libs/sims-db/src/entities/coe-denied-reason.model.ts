import { Column, Entity, PrimaryColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { OfferingIntensity } from "@sims/sims-db/entities/offering-intensity.type";

@Entity({ name: TableNames.COEDeniedReason })
export class COEDeniedReason extends RecordDataModel {
  /**
   *  Primary key column.
   */
  @PrimaryColumn({
    name: "id",
    nullable: false,
  })
  id: number;
  /**
   * Reason
   */
  @Column({
    name: "reason",
    nullable: false,
  })
  reason: string;
  /**
   * Active Indicator
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  isActive: boolean;
  /**
   * Define if the message is specific to full-time or part-time.
   * If null, the message is applicable for both intensities.
   */
  @Column({
    name: "offering_intensity",
    type: "enum",
    enum: OfferingIntensity,
    enumName: "OfferingIntensity",
    nullable: true,
  })
  offeringIntensity?: OfferingIntensity;
}
