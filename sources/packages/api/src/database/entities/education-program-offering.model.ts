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
import { EducationProgram } from "./education-program.model";
import { InstitutionLocation } from "./institution-location.model";
import { OfferingTypes, User, OfferingStatus, Note } from ".";
import { OfferingIntensity } from "./offering-intensity.type";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";

/**
 * The main resource table to store education programs offerings related information.
 * Education programs offering is for a particular program and location.
 */
@Entity({ name: TableNames.EducationProgramsOfferings })
export class EducationProgramOffering extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Offering name
   */
  @Column({
    name: "offering_name",
  })
  name: string;
  /**
   * Offering Study start date
   */
  @Column({
    name: "study_start_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  studyStartDate: Date;
  /**
   * Offering Study end date
   */
  @Column({
    name: "study_end_date",
    type: "date",
    nullable: true,
    transformer: dateOnlyTransformer,
  })
  studyEndDate: Date;
  /**
   * Offering Actual Tuition Costs
   */
  @Column({
    name: "actual_tuition_costs",
    nullable: true,
  })
  actualTuitionCosts: number;
  /**
   * Offering Program Related Costs
   */
  @Column({
    name: "program_related_costs",
    nullable: true,
  })
  programRelatedCosts: number;
  /**
   * Offering Mandatory Fees
   */
  @Column({
    name: "mandatory_fees",
    nullable: true,
  })
  mandatoryFees: number;
  /**
   * Offering Exceptional Expenses
   */
  @Column({
    name: "exceptional_expenses",
    nullable: true,
  })
  exceptionalExpenses: number;
  /**
   * How Offering is Delivered like Onsite, Online, Blended
   */
  @Column({
    name: "offering_delivered",
  })
  offeringDelivered: string;
  /**
   * Offering does not have Study Breaks?
   */
  @Column({
    name: "lacks_study_breaks",
  })
  lacksStudyBreaks: boolean;
  /**
   * Related program.
   */
  @OneToOne(() => EducationProgram, { eager: false, cascade: true })
  @JoinColumn({
    name: "program_id",
    referencedColumnName: ColumnNames.ID,
  })
  educationProgram: EducationProgram;
  /**
   * Related location.
   */
  @OneToOne(() => InstitutionLocation, { eager: false, cascade: true })
  @JoinColumn({
    name: "location_id",
    referencedColumnName: ColumnNames.ID,
  })
  institutionLocation: InstitutionLocation;
  /**
   * Defines the type of the offering.
   */
  @Column({
    name: "offering_type",
    nullable: false,
    type: "enum",
    enum: OfferingTypes,
    enumName: "OfferingTypes",
  })
  offeringType: OfferingTypes;
  /**
   *offering_intensity decides if offering is Full-Time or Part-Time.
   */
  @Column({
    name: "offering_intensity",
    nullable: false,
  })
  offeringIntensity: OfferingIntensity;

  /**
   * Offering year of study.
   */
  @Column({
    name: "year_of_study",
  })
  yearOfStudy: number;

  /**
   * Show year of study to student based on this value.
   */
  @Column({
    name: "show_year_of_study",
  })
  showYearOfStudy?: boolean;

  /**
   * Determines if the offering has WIL component.
   */
  @Column({
    name: "has_offering_wil_component",
  })
  hasOfferingWILComponent: string;

  /**
   * WIL component type of the offering.
   */
  @Column({
    name: "offering_wil_type",
  })
  offeringWILType?: string;

  /**
   * List of study breaks.
   */
  @Column({
    name: "study_breaks",
    type: "jsonb",
  })
  studyBreaks?: StudyBreaksAndWeeks;

  /**
   * Declaration by the user creating or updating the offering.
   */
  @Column({
    name: "offering_declaration",
  })
  offeringDeclaration: boolean;

  /**
   * User who assessed the offering.
   */
  @ManyToOne(() => User, { eager: false, nullable: true })
  @JoinColumn({
    name: "assessed_by",
    referencedColumnName: "id",
  })
  assessedBy?: User;

  /**
   * Date-time at which the offering was assessed.
   */
  @Column({
    name: "assessed_date",
    type: "timestamptz",
    nullable: true,
  })
  assessedDate?: Date;

  /**
   * Education program offering submitted date.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;

  /**
   * Represents the current status of an offering.
   */
  @Column({
    name: "offering_status",
    type: "enum",
    enum: OfferingStatus,
    enumName: "OfferingStatus",
  })
  offeringStatus: OfferingStatus;

  /**
   * Note added by ministry user to either approve or decline an offering.
   */
  @OneToOne(() => Note, { eager: false, nullable: true })
  @JoinColumn({
    name: "offering_note",
    referencedColumnName: ColumnNames.ID,
  })
  offeringNote?: Note;
  /**
   * Course Load for Part Time offering intensity.
   */
  @Column({
    name: "course_load",
    type: "smallint",
    nullable: true,
  })
  courseLoad?: number;

  /**
   * The parent offering from which
   * the current offering was created during request for change.
   */
  @ManyToOne(() => EducationProgramOffering, { eager: false, nullable: true })
  @JoinColumn({
    name: "parent_offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  parentOffering?: EducationProgramOffering;

  /**
   * The immediate previous offering from which the current offering was created
   *  during request for change.
   */
  @ManyToOne(() => EducationProgramOffering, { eager: false, nullable: true })
  @JoinColumn({
    name: "preceding_offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  precedingOffering?: EducationProgramOffering;

  @RelationId(
    (offering: EducationProgramOffering) => offering.precedingOffering,
  )
  precedingOfferingId: number;
}

/**
 * Study break.
 */
export interface StudyBreak {
  breakStartDate: Date;
  breakEndDate: Date;
}

/**
 * Interface for study breaks with funded and unfunded weeks properties.
 */
export interface StudyBreaksAndWeeks {
  studyBreaks: StudyBreak[];
  fundedStudyPeriodDays: number;
  totalDays: number;
  totalFundedWeeks: number;
  unfundedStudyPeriodDays: number;
}
