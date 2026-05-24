import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import {
  RecordDataModel,
  Student,
  StudentDisabilityProfileDisability,
} from ".";
import { DisabilityProfileStatus } from "./disability-profile-status.type";

/**
 * Disability profiles, current and historical. Each profile can have multiple disabilities.
 */
@Entity({ name: TableNames.StudentDisabilityProfiles })
export class StudentDisabilityProfile extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Student associated with this disability profile.
   */
  @ManyToOne(() => Student, { nullable: false })
  @JoinColumn({
    name: "student_id",
    referencedColumnName: ColumnNames.ID,
  })
  student: Student;
  /**
   * Current lifecycle status of the disability profile.
   */
  @Column({
    name: "disability_profile_status",
    type: "enum",
    enum: DisabilityProfileStatus,
    enumName: "disability_profile_status",
  })
  disabilityProfileStatus: DisabilityProfileStatus;
  /**
   * Timestamp when the profile was soft-deleted. Can only be set while the profile is in Draft status.
   */
  @Column({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt?: Date;
  /**
   * Disabilities associated with this profile.
   */
  @ManyToOne(() => StudentDisabilityProfileDisability, {
    cascade: ["insert", "update"],
  })
  @JoinColumn({
    name: "id",
    referencedColumnName: "studentDisabilityProfileId",
  })
  disabilities: StudentDisabilityProfileDisability[];
}
