import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ColumnNames, TableNames } from "../constant";
import { RecordDataModel } from "./record.model";
import { User } from "./user.model";
import { ReturnedLoanCustomer } from "./returned-loan-customer.model";
import { ReturnedLoanEventStatus } from "./returned-loan-event-status.type";
import { numericTransformer } from "../transformers/numeric.transformer";

/**
 * Returned loan events.
 */
@Entity({ name: TableNames.ReturnedLoanEvents })
export class ReturnedLoanEvent extends RecordDataModel {
  /**
   * Auto-generated sequential primary key column.
   */
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Event status of the returned loan event.
   */
  @Column({
    name: "event_status",
    type: "enum",
    enum: ReturnedLoanEventStatus,
    enumName: "ReturnedLoanEventStatus",
  })
  eventStatus: ReturnedLoanEventStatus;
  /**
   * Customer to whom the returned loan belongs to.
   */
  @ManyToOne(() => ReturnedLoanCustomer, { nullable: false })
  @JoinColumn({
    name: "customer",
    referencedColumnName: ColumnNames.ID,
  })
  customer: ReturnedLoanCustomer;
  /**
   * The immediate previous version of the returned loan event.
   */
  @ManyToOne(() => ReturnedLoanEvent, { nullable: true })
  @JoinColumn({
    name: "preceding_event",
    referencedColumnName: ColumnNames.ID,
  })
  precedingEvent?: ReturnedLoanEvent;
  /**
   * The parent or first version of the returned loan event.
   */
  @ManyToOne(() => ReturnedLoanEvent, { nullable: true })
  @JoinColumn({
    name: "parent_event",
    referencedColumnName: ColumnNames.ID,
  })
  parentEvent?: ReturnedLoanEvent;
  /**
   * User who updated the event status.
   */
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({
    name: "event_status_updated_by",
    referencedColumnName: ColumnNames.ID,
  })
  eventStatusUpdatedBy?: User;
  /**
   * Timestamp when the event status was updated.
   */
  @Column({
    name: "event_status_updated_on",
    type: "timestamptz",
    nullable: true,
  })
  eventStatusUpdatedOn?: Date;
  /**
   * Return reason, validated against the system lookup
   * configuration for returned loan reasons.
   */
  @Column({
    name: "return_reason",
  })
  returnReason: string;
  /**
   * Returned loan file name.
   */
  @Column({
    name: "file_name",
  })
  fileName: string;
  /**
   * Returned loan file sequence number.
   */
  @Column({
    name: "file_sequence_number",
  })
  fileSequenceNumber: number;
  /**
   * Returned loan file creation date.
   */
  @Column({
    name: "file_creation_date",
    type: "date",
  })
  fileCreationDate: string;
  /**
   * Type of loan. FS - full-time loan, PS - part-time loan.
   */
  @Column({
    name: "loan_type",
    nullable: true,
  })
  loanType?: string;
  /**
   * Type of loan agreement.
   */
  @Column({
    name: "loan_agreement_type",
    nullable: true,
  })
  loanAgreementType?: string;
  /**
   * Issuing province.
   */
  @Column({
    name: "issuing_province",
    type: "char",
    nullable: true,
  })
  issuingProvince?: string;
  /**
   * Education institution code.
   */
  @Column({
    name: "education_institution_code",
    type: "char",
    nullable: true,
  })
  educationInstitutionCode?: string;
  /**
   * Loan class.
   */
  @Column({
    name: "loan_class",
    type: "char",
    nullable: true,
  })
  loanClass?: string;
  /**
   * Service Provider loan identification number - division code.
   */
  @Column({
    name: "loan_identification_division_code",
    type: "char",
    nullable: false,
  })
  loanIdentificationDivisionCode: string;
  /**
   * Service Provider loan identification number - loan number.
   */
  @Column({
    name: "loan_identification_loan_number",
    nullable: false,
  })
  loanIdentificationLoanNumber: number;
  /**
   * Contract number.
   */
  @Column({
    name: "contract_number",
    nullable: false,
  })
  contractNumber: number;
  /**
   * Consolidation date.
   */
  @Column({
    name: "consolidation_date",
    type: "date",
    nullable: true,
  })
  consolidationDate?: string;
  /**
   * Date of 'Return to Government' event.
   */
  @Column({
    name: "event_date",
    type: "date",
    nullable: true,
  })
  eventDate?: string;
  /**
   * The final limitation start date provided by ministry user.
   */
  @Column({
    name: "original_due_date",
    type: "date",
    nullable: true,
  })
  originalDueDate?: string;
  /**
   * The limitation start date calculated based on event date.
   */
  @Column({
    name: "calculated_limitation_start_date",
    type: "date",
    nullable: true,
  })
  calculatedLimitationStartDate?: string;
  /**
   * Threshold date which is calculated based on file creation date to identify
   * if calculated limitation start date falls within this date.
   */
  @Column({
    name: "review_threshold_date",
    type: "date",
    nullable: true,
  })
  reviewThresholdDate?: string;
  /**
   * Study end month stored as a date using first day of the month
   * (e.g. 2026-10 is stored as 2026-10-01).
   */
  @Column({
    name: "study_end_month",
    type: "date",
    nullable: true,
  })
  studyEndMonth?: string;
  /**
   * Original debt from this account.
   */
  @Column({
    name: "original_balance",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  originalBalance?: number;
  /**
   * Total principal outstanding of the loan at time of return.
   */
  @Column({
    name: "total_principal_outstanding",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  totalPrincipalOutstanding?: number;
  /**
   * Accrued interest calculating from interest owing from date up to interest owing to date.
   */
  @Column({
    name: "accrued_interest",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  accruedInterest?: number;
  /**
   * Total returned amount.
   */
  @Column({
    name: "total_returned_amount",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  totalReturnedAmount?: number;
  /**
   * Interest owing from date.
   */
  @Column({
    name: "interest_owing_from_date",
    type: "date",
    nullable: true,
  })
  interestOwingFromDate?: string;
  /**
   * Interest owing to date.
   */
  @Column({
    name: "interest_owing_to_date",
    type: "date",
    nullable: true,
  })
  interestOwingToDate?: string;
  /**
   * Interest rate type. FXD - fixed interest rate, PR+ - prime plus interest (variable).
   */
  @Column({
    name: "interest_rate_type",
    type: "char",
    nullable: true,
  })
  interestRateType?: string;
  /**
   * Interest rate (fixed rate).
   */
  @Column({
    name: "fixed_interest_rate",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  fixedInterestRate?: number;
  /**
   * Interest spread for floating rate.
   */
  @Column({
    name: "variable_interest_spread",
    type: "numeric",
    nullable: true,
    transformer: numericTransformer,
  })
  variableInterestSpread?: number;
}
