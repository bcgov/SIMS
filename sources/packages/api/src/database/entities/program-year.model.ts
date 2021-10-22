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
    nullable: false,
  })
  programYearDesc: string;
  /**
   * Form to be loaded for the ProgramYear
   */
  @Column({
    name: "form_name",
    nullable: false,
  })
  formName: string;
  /**
   * Form to be loaded for supporting users
   * of type Parent for the ProgramYear.
   */
  @Column({
    name: "form_name_parent",
    nullable: false,
  })
  formNameParent: string;
  /**
   * Form to be loaded for supporting users
   * of type Partner for the ProgramYear.
   */
  @Column({
    name: "form_name_partner",
    nullable: false,
  })
  formNamePartner: string;
  /**
   * Active Indicator
   */
  @Column({
    name: "is_active",
    nullable: false,
  })
  active: boolean;
  /**
   * Inclusive start date that this program year
   * should be considered valid.
   */
  @Column({
    name: "start_date",
    type: "date",
  })
  startDate: Date;
  /**
   * Inclusive end date that this program year
   * should be considered valid.
   */
  @Column({
    name: "end_date",
    type: "date",
  })
  endDate: Date;
}
