import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { TableNames } from "../constant";
import { RecordDataModel } from "./record.model";

@Entity({ name: TableNames.ProgramYear })
export class ProgramYear extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Program Year
   */
  @Column({
    name: "program_year",
    nullable: false,
  })
  programYear: string;
  /**
   * Program Year Description
   */
  @Column({
    name: "program_year_desc",
    nullable: true,
  })
  programYearDesc: string;
  /**
   * Form to be loaded for the ProgramYear
   */
  @Column({
    name: "form_name",
    nullable: true,
  })
  formName: string;
  /**
   * Active Indicator
   */
  @Column({
    name: "active_indicator",
    nullable: false,
  })
  active: boolean;
}
