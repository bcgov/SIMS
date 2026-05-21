import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from ".";
import { StudentDisabilityProfile } from "./student-disability-profile.model";

/**
 * Individual disability entries associated with a student disability profile.
 */
@Entity({ name: TableNames.StudentDisabilityProfileDisabilities })
export class StudentDisabilityProfileDisability extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Disability profile this disability entry belongs to.
   */
  @ManyToOne(() => StudentDisabilityProfile, { nullable: false })
  @JoinColumn({
    name: "student_disability_profile_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentDisabilityProfile: StudentDisabilityProfile;
  /**
   * Order of the disability within the profile, where 1 indicates the primary disability
   * and higher values indicate additional disabilities.
   */
  @Column({
    name: "disability_priority",
    type: "smallint",
  })
  disabilityPriority: number;
  /**
   * Category of the disability, validated against the system lookup configuration
   * for disability category.
   */
  @Column({
    name: "disability_category",
  })
  disabilityCategory: string;
  /**
   * Designation of the disability (e.g. Permanent, Persistent or prolonged), validated
   * against the system lookup configuration for disability type.
   */
  @Column({
    name: "disability_type",
  })
  disabilityType: string;
  /**
   * Additional notes describing the disability. Required when disability type is OTHER.
   */
  @Column({
    name: "disability_notes",
    nullable: true,
  })
  disabilityNotes?: string;
  /**
   * List of functional impairments associated with this disability. The available list of
   * impairments is stored in the system lookup configuration for disability impairments.
   */
  @Column({
    name: "impairments",
    type: "varchar",
    array: true,
  })
  impairments: string[];
  /**
   * Additional notes related to the listed impairments.
   */
  @Column({
    name: "impairments_notes",
    nullable: true,
  })
  impairmentsNotes?: string;
  /**
   * Primary diagnosis information for this disability.
   */
  @Column({
    name: "diagnosis",
  })
  diagnosis: string;
  /**
   * Additional notes related to the diagnosis.
   */
  @Column({
    name: "diagnosis_notes",
    nullable: true,
  })
  diagnosisNotes?: string;
  /**
   * Any additional notes relevant to this disability entry.
   */
  @Column({
    name: "additional_notes",
    nullable: true,
  })
  additionalNotes?: string;
}
