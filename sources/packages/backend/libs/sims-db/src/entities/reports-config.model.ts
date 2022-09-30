import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

/**
 * Entity for reports config table that holds the dynamic sql of reports.
 */
@Entity({ name: TableNames.ReportsConfig })
export class ReportConfig extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Unique report name that refers to a report.
   */
  @Column({
    name: "report_name",
    nullable: false,
  })
  reportName: string;
  /**
   * SQL of a report.
   */
  @Column({
    name: "report_sql",
    nullable: false,
  })
  reportSQL: string;
}
