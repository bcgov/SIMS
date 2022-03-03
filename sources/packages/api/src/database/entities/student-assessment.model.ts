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
  DesignationAgreementLocation,
  DesignationAgreementStatus,
  EducationProgramOffering,
  Institution,
  User,
} from ".";
import { ColumnNames, TableNames } from "../constant";
import { dateOnlyTransformer } from "../transformers/date-only.transformer";
import { AssessmentTriggerType } from "./assessment_trigger.type";
import { RecordDataModel } from "./record.model";

/**
 * Represents all the assessments and reassessments processed for a particular
 * Student Application. When a assessment/reassessment is needed it will use
 * the information present in the application itself combined with the additional
 * data present in this table (e.g. student appeals and scholastic standing changes).
 */
@Entity({ name: TableNames.StudentAssessment })
export class StudentAssessment extends RecordDataModel {
  @PrimaryGeneratedColumn()
  id: number;
  /**
   * Application id related to this assessment.
   */
  @RelationId(
    (studentAssessment: StudentAssessment) => studentAssessment.application,
  )
  applicationId: number;
  /**
   * Application related to this assessment.
   */
  @ManyToOne(() => Application, {
    eager: false,
    cascade: false,
    nullable: false,
  })
  @JoinColumn({
    name: "application_id",
    referencedColumnName: ColumnNames.ID,
  })
  application: Application;
  /**
   * Workflow instance that processed this assessment.
   */
  @Column({
    name: "assessment_workflow_id",
    nullable: true,
  })
  assessmentWorkflowId?: number;
  /**
   * Represent the output of the executed assessment workflow and it is also
   * the main content for the NOA.
   */
  @Column({
    name: "assessmentData",
    type: "jsonb",
    nullable: true,
  })
  assessmentData?: Assessment;
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
  })
  assessmentStatus: AssessmentTriggerType;
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
   * When the reassessment happen due to a student appeal, this will provide to the workflow the data that need be changed.
   */
  // TODO: student_appeal_id
  // TODO: student_scholastic_standing_id

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
  })
  noaApprovalStatus: AssessmentStatus;
}

/**
 * Interface for BaseAssessment values that are shared between FullTime and PartTime
 */
export interface BaseAssessment {
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
  miscellaneousCost: number;
  totalAcademicExpenses: number;
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
