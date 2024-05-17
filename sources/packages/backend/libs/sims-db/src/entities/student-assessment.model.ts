import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from "typeorm";
import {
  Application,
  AssessmentStatus,
  DisbursementSchedule,
  EducationProgramOffering,
  FormYesNoOptions,
  RelationshipStatus,
  StudentAppeal,
  StudentAssessmentStatus,
  User,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { AssessmentTriggerType } from "./assessment-trigger.type";
import { RecordDataModel } from "./record.model";
import { StudentScholasticStanding } from "./student-scholastic-standing.model";
import { ApplicationOfferingChangeRequest } from "./application-offering-change-request.model";

/**
 * Represents all the assessments and reassessments processed for a particular
 * Student Application. When a assessment/reassessment is needed it will use
 * the information present in the application itself combined with the additional
 * data present in this table (e.g. student appeals and scholastic standing changes).
 */
@Entity({ name: TableNames.StudentAssessments })
export class StudentAssessment extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Application related to this assessment.
   */
  @ManyToOne(() => Application, {
    eager: false,
    cascade: ["update"],
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Date that the assessment was submitted.
   */
  @Column({
    name: "submitted_date",
    type: "timestamptz",
    nullable: false,
  })
  submittedDate: Date;
  /**
   * Users that causes the assessment to be submitted.
   */
  @ManyToOne(() => User, { eager: false, cascade: false, nullable: false })
  @JoinColumn({
    name: "submitted_by",
    referencedColumnName: ColumnNames.ID,
  })
  submittedBy: User;
  /**
   * Workflow instance that processed this assessment.
   */
  @Column({
    name: "assessment_workflow_id",
    nullable: true,
  })
  assessmentWorkflowId?: string;
  /**
   * Represent the output of the executed assessment workflow and it is also
   * the main content for the NOA (Notice of Assessment).
   */
  @Column({
    name: "assessment_data",
    type: "jsonb",
    nullable: true,
  })
  assessmentData?: Assessment;
  /**
   * Date that the assessment was processed and the assessmentData was saved.
   */
  @Column({
    name: "assessment_date",
    type: "timestamptz",
    nullable: true,
  })
  assessmentDate?: Date;
  /**
   * Identifies what was the reason to the assessment happen. Usually one completed
   * Student Application will have only one record of type "Original assessment".
   * If more records are present they represents a reassessment that happened after
   * the Student Application was completed, for instance, due to a student appeal.
   */
  @Column({
    name: "trigger_type",
    type: "enum",
    enum: AssessmentTriggerType,
    enumName: "AssessmentTriggerType",
    nullable: false,
  })
  triggerType: AssessmentTriggerType;
  /**
   * Offering id that must be used for any assessment/reassessment. This information can
   * be null only during a PIR process. Upon a program/offering change, this will also
   * represent the new/changed program/offering.
   */
  @RelationId(
    (studentAssessment: StudentAssessment) => studentAssessment.offering,
  )
  offeringId?: number;
  /**
   * Offering that must be used for any assessment/reassessment. This information can
   * be null only during a PIR process. Upon a program/offering change, this will also
   * represent the new/changed program/offering.
   */
  @ManyToOne(() => EducationProgramOffering, {
    eager: false,
    cascade: false,
    nullable: true,
  })
  @JoinColumn({
    name: "offering_id",
    referencedColumnName: ColumnNames.ID,
  })
  offering?: EducationProgramOffering;
  /**
   * When the reassessment happen due to a student appeal, this will provide to
   * the workflow the data that need to be changed.
   */
  @RelationId(
    (studentAssessment: StudentAssessment) => studentAssessment.studentAppeal,
  )
  studentAppealId?: number;
  /**
   * When the reassessment happen due to a student appeal, this will provide to
   * the workflow the data that need to be changed.
   */
  @ManyToOne(
    () => StudentAppeal,
    (studentAppeal) => studentAppeal.studentAssessment,
    {
      eager: false,
      cascade: true,
      nullable: true,
    },
  )
  @JoinColumn({
    name: "student_appeal_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentAppeal?: StudentAppeal;
  /**
   * When the reassessment happen due to a scholastic standing change (e.g. student withdrawal),
   * this will provide to the workflow the data that need be changed.
   */
  @ManyToOne(() => StudentScholasticStanding, {
    eager: false,
    cascade: true,
    nullable: true,
  })
  @JoinColumn({
    name: "student_scholastic_standing_id",
    referencedColumnName: ColumnNames.ID,
  })
  studentScholasticStanding?: StudentScholasticStanding;
  /**
   * Indicates the status of the NOA approval when the student must approve the
   * money values prior to the institution COE approval and disbursements or when
   * a reassessment happened and a new approval is required.
   */
  @Column({
    name: "noa_approval_status",
    type: "enum",
    enum: AssessmentStatus,
    enumName: "AssessmentStatus",
    nullable: true,
  })
  noaApprovalStatus?: AssessmentStatus;
  /**
   * Disbursements related to this assessment.
   */
  @OneToMany(
    () => DisbursementSchedule,
    (disbursementSchedule) => disbursementSchedule.studentAssessment,
    {
      eager: false,
      cascade: ["insert", "update"],
      nullable: true,
    },
  )
  disbursementSchedules?: DisbursementSchedule[];
  /**
   * When the reassessment happen due to an application offering change request (by institution),
   * this will provide to the workflow the data that needs to be changed.
   */
  @ManyToOne(() => ApplicationOfferingChangeRequest, {
    eager: false,
    nullable: true,
  })
  @JoinColumn({
    name: "application_offering_change_request_id",
    referencedColumnName: ColumnNames.ID,
  })
  applicationOfferingChangeRequest?: ApplicationOfferingChangeRequest;
  /**
   * Output of workflow calculations and data used as calculations inputs.
   * Represents workflow variables that must be persisted after the workflow
   * is executed for easy application consumption.
   */
  @Column({
    name: "workflow_data",
    type: "jsonb",
    nullable: true,
  })
  workflowData?: WorkflowData;
  /**
   * Student assessment status from its creation till the workflow calculations are finalized
   * or the workflow is cancelled.
   */
  @Column({
    name: "student_assessment_status",
    type: "enum",
    enum: StudentAssessmentStatus,
    enumName: "StudentAssessmentStatus",
    nullable: false,
  })
  studentAssessmentStatus: StudentAssessmentStatus;
  /**
   * Date and time when the student_assessment_status column was updated.
   */
  @Column({
    name: "student_assessment_status_updated_on",
    type: "timestamptz",
    nullable: false,
  })
  studentAssessmentStatusUpdatedOn: Date;
  /**
   * Assessment calculation start date.
   */
  @Column({
    name: "calculation_start_date",
    type: "timestamptz",
    nullable: true,
  })
  calculationStartDate?: Date;
  /**
   * Assessment id of another application's assessment in which the
   * changes impacted this application causing it to be reassessed.
   */
  @ManyToOne(() => StudentAssessment, { nullable: true })
  @JoinColumn({
    name: "related_application_assessment_id",
    referencedColumnName: ColumnNames.ID,
  })
  relatedApplicationAssessment?: StudentAssessment;
  /**
   * Last reported assessment id corresponding to the offering date change.
   */
  @ManyToOne(() => StudentAssessment, { nullable: true })
  @Column({
    name: "previous_date_changed_reported_assessment_id",
    nullable: true,
  })
  previousDateChangedReportedAssessment?: StudentAssessment;
  /**
   * Timestamp for the last reported assessment id.
   */
  @Column({
    name: "reported_date",
    type: "timestamptz",
    nullable: true,
  })
  reportedDate?: Date;
}

/**
 * Interface for BaseAssessment values that are shared between FullTime and PartTime
 */
interface BaseAssessment {
  weeks: number;
  tuitionCost: number;
  childcareCost: number;
  transportationCost: number;
  booksAndSuppliesCost: number;
  totalFederalAward: number;
  totalProvincialAward: number;
  totalFamilyIncome: number;
  totalAssessmentNeed: number;
}

/**
 * Interface for FullTime assessment payload.
 */
export interface FullTimeAssessment extends BaseAssessment {
  federalAssessmentNeed: number;
  provincialAssessmentNeed: number;
  exceptionalEducationCost: number;
  livingAllowance: number;
  alimonyOrChildSupport: number;
  secondResidenceCost: number;
  partnerStudentLoanCost: number;
  totalAssessedCost: number;
  studentTotalFederalContribution: number;
  studentTotalProvincialContribution: number;
  partnerAssessedContribution: number;
  parentAssessedContribution: number;
  totalFederalContribution: number;
  totalProvincialContribution: number;
  otherAllowableCost: number;
}

/**
 * Interface for PartTime assessment payload.
 */
export interface PartTimeAssessment extends BaseAssessment {
  miscellaneousAllowance: number;
  totalAcademicExpenses: number;
  // TODO: Mandatory fees could be potentially part of base assessment.
  mandatoryFees: number;
}

/**
 * This is a type which provides the contract for FullTime and PartTime assessment payload
 * which is stored to database by workflow.
 * It is possible that more properties can be added to the assessment payload
 * without updating this interface and displayed in NOA form.
 * Whenever there is a source code update, please ensure that properties in this interface are in sync with
 * assessment payload created by camunda workflow.
 */
export type Assessment = FullTimeAssessment | PartTimeAssessment;

/**
 * Output of workflow calculations and data used as calculations inputs.
 * Represents workflow variables that must be persisted after the workflow
 * is executed for easy application consumption.
 */
export interface WorkflowData {
  studentData: {
    dependantStatus: "dependant" | "independant";
    relationshipStatus: RelationshipStatus;
    livingWithParents: FormYesNoOptions;
    numberOfParents?: number;
  };
  dmnValues?: {
    lifetimeMaximumCSLP?: number;
  };
  calculatedData: {
    parentalAssets?: number;
    studentMaritalStatusCode: StudentMaritalStatusCode;
    totalEligibleDependents?: number;
    familySize: number;
    parentalAssetContribution?: number;
    parentalContribution?: number;
    parentDiscretionaryIncome?: number;
    dependantTotalMSOLAllowance?: number;
    studentMSOLAllowance: number;
    totalChildCareCost?: number;
    totalNonEducationalCost: number;
    dependantChildQuantity?: number;
    dependantChildInDaycareQuantity?: number;
    dependantInfantQuantity?: number;
    dependantDeclaredOnTaxesQuantity?: number;
    dependantPostSecondaryQuantity?: number;
    pdppdStatus: boolean;
    partnerStudentStudyWeeks?: number;
  };
}

export type StudentMaritalStatusCode = "SI" | "SP" | "MA";
