import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Institution } from ".";
import { ProgramIntensity } from "./program-intensity.type";

/**
 * The main resource table to store education programs related information.
 * Tombstone information to education programs shared across institution locations.
 */
@Entity({ name: TableNames.EducationPrograms })
export class EducationProgram extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Program name.
   */
  @Column({
    name: "program_name",
  })
  name: string;
  /**
   * Program description.
   */
  @Column({
    name: "program_description",
  })
  description: string;
  /**
   * Credential types like: Diploma, Certificate, Degree, Masters, Doctorate, Other.
   */
  @Column({
    name: "credential_type",
  })
  credentialType: string;
  /**
   * Credential type descritpion when "Other" is selected for credential_type.
   */
  @Column({
    name: "credential_type_other",
  })
  credentialTypeOther: string;
  /**
   * Classification of Instructional Programs (CIP) Code.
   */
  @Column({
    name: "cip_code",
  })
  cipCode: string;
  /**
   * National Occupational Classification (NOC).
   */
  @Column({
    name: "noc_code",
  })
  nocCode: string;
  /**
   * SABC institution code, if this program has been approved for SABC funding before.
   */
  @Column({
    name: "sabc_code",
  })
  sabcCode: string;
  /**
   * Regulatory body ode. Which regulatory body has approved your delivery of this program.
   */
  @Column({
    name: "regulatory_body",
  })
  regulatoryBody: string;
  /**
   * How will this Program be delivered - On site.
   */
  @Column({
    name: "delivered_on_site",
  })
  deliveredOnSite: boolean;
  /**
   * How will this Program be delivered - Online.
   */
  @Column({
    name: "delivered_online",
  })
  deliveredOnline: boolean;
  /**
   * If the program is delivered online indicates if the same program is also delivered on site.
   */
  @Column({
    name: "delivered_online_also_onsite",
  })
  deliveredOnlineAlsoOnsite?: string;
  /**
   * Indicates if the students will earn the same number of credits in the same time period as
   * students in other StudentAid BC eligible programs delivered on site.
   */
  @Column({
    name: "same_online_credits_earned",
  })
  sameOnlineCreditsEarned?: string;
  /**
   * Indicates if the students will earn academic credits that are recognized at another designated institution
   * listed in the BC Transfer Guide or other acceptable articulation agreements from other jurisdictions.
   */
  @Column({
    name: "earn_academic_credits_other_institution",
  })
  earnAcademicCreditsOtherInstitution?: string;
  /**
   * Program course load calculation options like "Credit based" or "Hours based".
   */
  @Column({
    name: "course_load_calculation",
  })
  courseLoadCalculation: string;
  /**
   * Average hours of study.
   */
  @Column({
    name: "average_hours_study",
  })
  averageHoursStudy: number;
  /**
   * Code for years required to complete this program.
   */
  @Column({
    name: "completion_years",
  })
  completionYears: string;
  /**
   * Code for the admission requirements for this program.
   */
  @Column({
    name: "admission_requirement",
  })
  admissionRequirement: string;
  /**
   * Indicates if there is a minimum age requirement.
   */
  @Column({
    name: "has_minimun_age",
  })
  hasMinimunAge?: string;
  /**
   * Code to indicates the "English as a Second Language (ESL)" requirement
   */
  @Column({
    name: "esl_eligibility",
  })
  eslEligibility: string;
  /**
   * Indicates if the program is offered jointly or in partnership
   * with other institutions.
   */
  @Column({
    name: "has_joint_institution",
  })
  hasJointInstitution: string;
  /**
   * When institution has partners this indicates if all institutions you
   * partner with for this program are designated by Student Aid BC.
   */
  @Column({
    name: "has_joint_designated_institution",
  })
  hasJointDesignatedInstitution: string;
  /**
   * Approval status of the program like pending or approved.
   */
  @Column({
    name: "approval_status",
  })
  approvalStatus: string;
  /**
   * Related institution.
   */
  @OneToOne((_) => Institution, { eager: false, cascade: true })
  @JoinColumn({
    name: "institution_id",
    referencedColumnName: ColumnNames.ID,
  })
  institution: Institution;
  /**
   * If program_intensity is yes, then the program is both Full-Time and Part-Time,
   * if program_intensity is no, then the program is only Full-Time basis.
   */
  @Column({
    name: "program_intensity",
    nullable: false,
    type: "enum",
  })
  programIntensity: ProgramIntensity;
}
