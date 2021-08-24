import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

@Entity({ name: TableNames.PIRDeniedReason })
export class PirDeniedReason extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
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
  active: boolean;
}
