import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { EducationProgram } from "./education-program.model";
import { InstitutionLocation } from "./institution-location.model";
import { OfferingTypes } from ".";
import { OfferingIntensity } from "./offering-intensity.type";

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
    nullable: true,
  })
  studyStartDate: Date;
  /**
   * Offering Study end date
   */
  @Column({
    name: "study_end_date",
    nullable: true,
  })
  studyEndDate: Date;
  /**
   * Offering Break start date
   */
  @Column({
    name: "break_start_date",
    nullable: true,
  })
  breakStartDate: Date;
  /**
   * Offering Break end date
   */
  @Column({
    name: "break_end_date",
    nullable: true,
  })
  breakEndDate: Date;
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
    type: "enum",
  })
  offeringType: OfferingTypes;
  /**
   *offering_intensity decides if offering is Full-Time or Part-Time
   */
  @Column({
    name: "offering_intensity",
    nullable: false,
  })
  offeringIntensity: OfferingIntensity;
}
