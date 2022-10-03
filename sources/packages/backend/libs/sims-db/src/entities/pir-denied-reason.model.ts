import { Column, Entity, PrimaryColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

@Entity({ name: TableNames.PIRDeniedReason })
export class PIRDeniedReason extends RecordDataModel {
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
}
