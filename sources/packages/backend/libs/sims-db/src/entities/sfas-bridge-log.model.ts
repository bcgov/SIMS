import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";

/**
 * Log the details of every bridge file generation from SIMS to SFAS.
 */
@Entity({ name: TableNames.SFASBridgeLogs })
export class SFASBridgeLog {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Timestamp when the bridge file data was extracted.
   */
  @Column({
    name: "reference_date",
    type: "timestamptz",
  })
  referenceDate: Date;

  /**
   * Generated bridge file name.
   */
  @Column({
    name: "generated_file_name",
  })
  generatedFileName: string;

  /**
   * Record creation timestamp.
   */
  @CreateDateColumn({
    name: ColumnNames.CreateTimestamp,
  })
  createdAt: Date;
}
