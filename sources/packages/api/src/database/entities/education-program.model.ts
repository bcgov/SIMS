import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { Institution, Note, User } from ".";
import { ProgramIntensity } from "./program-intensity.type";
import { ApprovalStatus } from "../../services/education-program/constants";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

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
  description?: string;
  /**
   * Credential types like: Diploma, Certificate, Degree, Masters, Doctorate, Other.
   */
  @Column({
    name: "credential_type",
  })
  credentialType: string;
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
   * Code for years required to complete this program.
   */
  @Column({
    name: "completion_years",
  })
  completionYears: string;
  /**
   * Indicates if there is a minimum age requirement.
   */
  @Column({
    name: "has_minimum_age",
  })
  hasMinimumAge?: boolean;
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
  approvalStatus: ApprovalStatus;
  /**
   * Related institution.
   */

  @RelationId((program: EducationProgram) => program.institution)
  institutionId: number;

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

  /**
   * Institution program code of the given program
   */
  @Column({
    name: "institution_program_code",
  })
  institutionProgramCode?: string;

  /**
   * Minimum hours check for a general program.
   */
  @Column({
    name: "min_hours_week",
  })
  minHoursWeek?: string;

  /**
   * Identifier for aviation program.
   */
  @Column({
    name: "is_aviation_program",
  })
  isAviationProgram?: string;

  /**
   * Minimum hours check for a aviation program.
   */
  @Column({
    name: "min_hours_week_avi",
  })
  minHoursWeekAvi?: string;

  /**
   * Entrance eligibility of minimum grade 12
   */
  @Column({
    name: "min_high_school",
  })
  minHighSchool?: boolean;

  /**
   * Entrance eligibility established by institution.
   */
  @Column({
    name: "requirements_by_institution",
  })
  requirementsByInstitution?: boolean;

  /**
   * Entrance eligibility by B.C ITA.
   */
  @Column({
    name: "requirements_by_bcita",
  })
  requirementsByBCITA?: boolean;

  /**
   * Identifier for Work Integrated(WIL) Learning component.
   */
  @Column({
    name: "has_wil_component",
  })
  hasWILComponent: string;

  /**
   * Determines if WIL is approved by regulator or oversight body.
   */
  @Column({
    name: "is_wil_approved",
  })
  isWILApproved?: string;

  /**
   * Determines if WIL meet the program eligibility requirements according to StudentAid BC policy.
   */
  @Column({
    name: "wil_program_eligibility",
  })
  wilProgramEligibility?: string;

  /**
   * Identifier for Field trip, field placement, or travel component in program.
   */
  @Column({
    name: "has_travel",
  })
  hasTravel: string;

  /**
   * Determines if Field trip, field placement, or travel meet the program eligibility requirements according to StudentAid BC policy.
   */
  @Column({
    name: "travel_program_eligibility",
  })
  travelProgramEligibility?: string;

  /**
   * Identifier for international exchange in program.
   */
  @Column({
    name: "has_intl_exchange",
  })
  hasIntlExchange: string;

  /**
   * Determines if international exchange meet the program eligibility requirements according to StudentAid BC policy.
   */
  @Column({
    name: "intl_exchange_program_eligibility",
  })
  intlExchangeProgramEligibility?: string;

  /**
   * Declaration confirming this program meets the policies outlined in the StudentAid BC policy manual.
   */
  @Column({
    name: "program_declaration",
  })
  programDeclaration: boolean;

  /**
   * Education program submitted date.
   */
  @Column({
    name: "submitted_on",
    type: "timestamptz",
    nullable: false,
  })
  submittedOn: Date;

  /**
   * Education program status updated on.
   */
  @Column({
    name: "status_updated_on",
    type: "timestamptz",
    nullable: false,
  })
  statusUpdatedOn: Date;

  /**
   * Effective End date of the approved Education program.
   */
  @Column({
    name: "effective_end_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  effectiveEndDate?: Date;

  /**
   * Education program note.
   */
  @RelationId((program: EducationProgram) => program.programNote)
  programNoteId?: number;

  @OneToOne(() => Note, { eager: false, cascade: true, nullable: true })
  @JoinColumn({
    name: "program_note",
    referencedColumnName: ColumnNames.ID,
  })
  programNote?: Note;

  /**
   * Education program status updated by.
   */
  @RelationId((program: EducationProgram) => program.statusUpdatedBy)
  statusUpdatedById?: number;

  @ManyToOne((type) => User, { eager: false, nullable: true })
  @JoinColumn({
    name: "status_updated_by",
    referencedColumnName: "id",
  })
  statusUpdatedBy?: User;

  /**
   * Education program submitted by.
   */
  @RelationId((program: EducationProgram) => program.submittedBy)
  submittedById?: number;

  @ManyToOne((type) => User, { eager: false, nullable: true })
  @JoinColumn({
    name: "submitted_by",
    referencedColumnName: "id",
  })
  submittedBy: User;
}
