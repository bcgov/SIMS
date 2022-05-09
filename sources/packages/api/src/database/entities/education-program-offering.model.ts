import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
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
   * Offering Tuition Remittance Amount Requested
   */
  @Column({
    name: "tuition_remittance_requested_amount",
    nullable: true,
  })
  tuitionRemittanceRequestedAmount: number;
  /**
   * How Offering is Delivered like Onsite, Online, Blended
   */
  @Column({
    name: "offering_delivered",
  })
  offeringDelivered: string;
  /**
   * Offering does not have Study Dates?
   */
  @Column({
    name: "lacks_study_dates",
  })
  lacksStudyDates: boolean;
  /**
   * Offering does not have Study Breaks?
   */
  @Column({
    name: "lacks_study_breaks",
  })
  lacksStudyBreaks: boolean;
  /**
   * Offering does not have Fixed Costs?
   */
  @Column({
    name: "lacks_fixed_costs",
  })
  lacksFixedCosts: boolean;
  /**
   * Offering Tuition Remittance Requested like Yes, No
   */
  @Column({
    name: "tuition_remittance_requested",
  })
  tuitionRemittanceRequested: string;
  /**
   * Related program.
   */
  @OneToOne((_) => EducationProgram, { eager: false, cascade: true })
  @JoinColumn({
    name: "program_id",
    referencedColumnName: ColumnNames.ID,
  })
  educationProgram: EducationProgram;
  /**
   * Related location.
   */
  @OneToOne((_) => InstitutionLocation, { eager: false, cascade: true })
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
  studyBreaks?: StudyBreak[];

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
  @OneToOne(() => Note, { eager: false, cascade: true, nullable: true })
  @JoinColumn({
    name: "offering_note",
    referencedColumnName: ColumnNames.ID,
  })
  offeringNote?: Note;
}

/**
 * Interface for study break item.
 */
export interface StudyBreak {
  breakStartDate: Date;
  breakEndDate: Date;
}
