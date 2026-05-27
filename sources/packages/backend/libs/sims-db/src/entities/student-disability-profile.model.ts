import {
  Column,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import {
  RecordDataModel,
  Student,
  StudentDisabilityProfileDisability,
  User,
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
   * User who completed the profile. Populated once the profile leaves Draft status.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "completed_by",
    referencedColumnName: ColumnNames.ID,
  })
  completedBy?: User;
  /**
   * Timestamp when the profile was completed.
   */
  @Column({
    name: "completed_at",
    type: "timestamptz",
    nullable: true,
  })
  completedAt?: Date;
  /**
   * Timestamp when the profile was soft-deleted.
   */
  @DeleteDateColumn({
    name: "deleted_at",
    type: "timestamptz",
    nullable: true,
  })
  deletedAt?: Date;
  /**
   * Disabilities associated with this profile.
   */
  @OneToMany(
    () => StudentDisabilityProfileDisability,
    (studentDisabilityProfileDisability) =>
      studentDisabilityProfileDisability.studentDisabilityProfile,
    {
      cascade: ["insert", "update"],
    },
  )
  disabilities: StudentDisabilityProfileDisability[];
}
