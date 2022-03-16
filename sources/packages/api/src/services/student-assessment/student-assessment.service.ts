import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  ApplicationStatus,
  AssessmentStatus,
  AssessmentTriggerType,
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  ProgramInfoStatus,
  StudentAssessment,
} from "../../database/entities";
import { Connection, IsNull, UpdateResult } from "typeorm";
import { CustomNamedError } from "../../utilities";
import { INVALID_OPERATION_IN_THE_CURRENT_STATUS } from "../application/application.service";
import { WorkflowActionsService } from "..";
import { ASSESSMENT_NOT_FOUND } from "./student-assessment.constants";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    connection: Connection,
    private readonly workflow: WorkflowActionsService,
  ) {
    super(connection.getRepository(StudentAssessment));
  }

  /**
   * Get the assessment and the related application information.
   * * This method is used by the the assessment workflow as a main source
   * * of information for the assessment/reassessment and the application.
   * @param assessmentId assessment id .
   * @returns assessment and the related application information.
   */
  async getById(assessmentId: number): Promise<StudentAssessment> {
    return this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "application.data",
        "programYear.programYear",
        "programYear.startDate",
        "programYear.endDate",
        "offering.id",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
        "offering.tuitionRemittanceRequestedAmount",
        "offering.offeringDelivered",
        "offering.offeringIntensity",
        "educationProgram.id",
        "educationProgram.credentialType",
        "educationProgram.completionYears",
        "institution.id",
        "institutionType.name",
        "location.data",
        "student.id",
        "student.studentPDVerified",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.student", "student")
      .leftJoin("assessment.offering", "offering")
      .leftJoin("offering.educationProgram", "educationProgram")
      .leftJoin("application.location", "location")
      .leftJoin("location.institution", "institution")
      .leftJoin("institution.institutionType", "institutionType")
      .andWhere("assessment.id = :assessmentId", {
        assessmentId,
      })
      .getOne();
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param assessmentId assessment id to be updated.
   * @param locationId location id related to the offering.
   * @param status status of the program information request.
   * @param programId program id related to the application.
   * When the application do not have an offering, this is used
   * to determine the associated program.
   * @param offeringId offering id, when available, otherwise
   * a PIR request need happen to an offering id be provided.
   * @returns program info update result.
   */
  async updateProgramInfo(
    assessmentId: number,
    locationId: number,
    status: ProgramInfoStatus,
    programId?: number,
    offeringId?: number,
  ): Promise<StudentAssessment> {
    const assessment = await this.repo
      .createQueryBuilder("assessment")
      .select(["assessment.id", "application.id"])
      .innerJoin("assessment.application", "application")
      .where("assessment.id = :assessmentId", { assessmentId })
      .getOne();

    if (!assessment) {
      throw new CustomNamedError(
        `Not able to find the assessment id ${assessmentId}`,
        ASSESSMENT_NOT_FOUND,
      );
    }

    assessment.application.location = { id: locationId } as InstitutionLocation;
    assessment.application.pirProgram = { id: programId } as EducationProgram;
    assessment.application.pirStatus = status;
    assessment.offering = {
      id: offeringId,
    } as EducationProgramOffering;
    // TODO: Kept for backward compatibility. It will be removed in an upcoming PR.
    assessment.application.offering = {
      id: offeringId,
    } as EducationProgramOffering;

    return this.repo.save(assessment);
  }

  /**
   * Updates the assessment workflowId.
   * The workflow id on the assessment table must be null otherwise
   * the update will not be performed. Avoiding the update prevents
   * that two different workflow instances try to process the same
   * assessment.
   * @param assessmentId assessment id to be updated.
   * @param assessmentWorkflowId workflowId to be updated.
   * @returns update result.
   */
  async updateWorkflowId(
    assessmentId: number,
    assessmentWorkflowId: string,
  ): Promise<UpdateResult> {
    return this.repo.update(
      { id: assessmentId, assessmentWorkflowId: IsNull() },
      { assessmentWorkflowId },
    );
  }

  /**
   * Starts the assessment workflow of one Student Application.
   * @param assessmentId Student assessment that need to be processed.
   */
  async startAssessment(assessmentId: number): Promise<void> {
    const assessment = await this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "assessment.assessmentWorkflowId",
        "assessment.triggerType",
        "application.id",
        "application.applicationStatus",
        "application.data",
      ])
      .innerJoin("assessment.application", "application")
      .where("assessment.id = :assessmentId", { assessmentId })
      .getOne();

    if (assessment.assessmentWorkflowId) {
      throw new CustomNamedError(
        `Student assessment was already started and has a workflow associated with. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.submitted
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.submitted}'. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type other than '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.completed}'. Assessment id ${assessmentId}`,
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }

    await this.workflow.startApplicationAssessment(
      assessment.application.data.workflowName,
      assessment.application.id,
      assessment.id,
    );
  }

  /**
   * Updates the assessment data resulted from the
   * assessment workflow process.
   * @param assessmentId assessment to be updated.
   * @param assessmentData data to be persisted.
   * @returns update result.
   */
  async updateAssessmentData(
    assessmentId: number,
    assessmentData: any,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: assessmentId,
      },
      { assessmentData, assessmentDate: new Date() },
    );
  }

  /**
   * Updates the NOA (notice of assessment) approval status.
   * The NOA status defines if the student needs to provide
   * his approval to the NOA or not.
   * @param assessmentId assessment id to be updated.
   * @param status status of the assessment.
   * @returns update result.
   */
  async updateNOAApprovalStatus(
    assessmentId: number,
    status: AssessmentStatus,
  ): Promise<UpdateResult> {
    return this.repo.update(
      {
        id: assessmentId,
      },
      { noaApprovalStatus: status },
    );
  }
}
