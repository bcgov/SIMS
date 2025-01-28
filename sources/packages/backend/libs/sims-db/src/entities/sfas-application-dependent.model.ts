import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { BaseModel, SFASApplication } from ".";

/**
 * Data related to student dependents (children) listed on each application in SFAS.
 */
@Entity({ name: TableNames.SFASApplicationDependents })
export class SFASApplicationDependent extends BaseModel {
  /**
   * The unique key/number assigned to each dependent record (applicant_dependent.applicant_dependent_idx).
   */
  @PrimaryColumn()
  id: number;
  /**
   * The unique key/number used in SFAS to identify this application (application.application_idx).
   */
  @ManyToOne(() => SFASApplication, {
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: SFASApplication;
  /**
   * First and last name of the child (may include other names as well) (applicant_dependent.dep_last_name).
   */
  @Column({
    name: "dependent_name",
    nullable: true,
  })
  dependentName?: string;
  /**
   * Date of birth of the dependent (applicant_dependent.dep_date_of_birth).
   */
  @Column({
    name: "dependent_birth_date",
    type: "date",
    nullable: true,
  })
  dependentBirthDate?: string;
  /**
   * Date that the record was extracted from SFAS.
   */
  @Column({
    name: "extracted_at",
    type: "timestamptz",
  })
  extractedAt: Date;
}
