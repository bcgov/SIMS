import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import {
  ApplicationExceptionStatus,
  ApplicationStatus,
  AssessmentStatus,
  AssessmentTriggerType,
  EducationProgram,
  InstitutionLocation,
  ProgramInfoStatus,
  StudentAppealStatus,
  StudentAssessment,
  User,
} from "../../database/entities";
import { Brackets, DataSource, IsNull, UpdateResult } from "typeorm";
import { CustomNamedError, mapFromRawAndEntities } from "../../utilities";
import { WorkflowActionsService } from "..";
import {
  ASSESSMENT_ALREADY_IN_PROGRESS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "./student-assessment.constants";
import {
  AssessmentHistory,
  StudentAssessmentStatus,
} from "./student-assessment.models";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    dataSource: DataSource,
    private readonly workflow: WorkflowActionsService,
  ) {
    super(dataSource.getRepository(StudentAssessment));
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
        "assessment.triggerType",
        "application.id",
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
        "offering.offeringDelivered",
        "offering.offeringIntensity",
        "offering.courseLoad",
        "offering.studyBreaks",
        "educationProgram.id",
        "educationProgram.credentialType",
        "educationProgram.completionYears",
        "institution.id",
        "institutionType.name",
        "student.id",
        "student.studentPDVerified",
        "supportingUser.id",
        "supportingUser.supportingUserType",
        "supportingUser.supportingData",
        "craIncomeVerification.id",
        "craIncomeVerification.craReportedIncome",
        "craIncomeVerification.taxYear",
        "craIncomeVerification.supportingUser.id",
        "studentAppeal.id",
        "appealRequest.id",
        "institutionLocation.data",
        "appealRequest.submittedFormName",
        "appealRequest.submittedData",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.student", "student")
      .leftJoin("assessment.offering", "offering")
      .leftJoin("offering.institutionLocation", "institutionLocation")
      .leftJoin("offering.educationProgram", "educationProgram")
      .leftJoin("institutionLocation.institution", "institution")
      .leftJoin("institution.institutionType", "institutionType")
      .leftJoin("application.supportingUsers", "supportingUser")
      .leftJoin("assessment.studentAppeal", "studentAppeal")
      .leftJoin(
        "studentAppeal.appealRequests",
        "appealRequest",
        "appealRequest.appealStatus = :appealStatus",
        { appealStatus: StudentAppealStatus.Approved },
      )
      .leftJoin("application.craIncomeVerifications", "craIncomeVerification")
      .where("assessment.id = :assessmentId", {
        assessmentId,
      })
      .getOne();
  }

  /**
   * Get the assessment data to load the NOA (Notice of Assessment)
   * for a student application.
   * @param assessmentId assessment id to be retrieved.
   * @param studentId student associated to the application. Provided
   * when an authorization check is needed.
   * @returns assessment NOA data.
   */
  async getAssessmentForNOA(
    assessmentId: number,
    studentId?: number,
  ): Promise<StudentAssessment> {
    const query = this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.assessmentData",
        "application.applicationNumber",
        "student.id",
        "user.firstName",
        "user.lastName",
        "educationProgram.name",
        "institution.operatingName",
        "location.name",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "offering.offeringIntensity",
        "msfaaNumber.msfaaNumber",
        "disbursementSchedule.id",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.tuitionRemittanceRequestedAmount",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("application.msfaaNumber", "msfaaNumber")
      .innerJoin("student.user", "user")
      .innerJoin("assessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("educationProgram.institution", "institution")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("assessment.disbursementSchedules", "disbursementSchedule")
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("assessment.id = :assessmentId", { assessmentId })
      .orderBy("disbursementSchedule.disbursementDate");

    if (studentId) {
      query.andWhere("student.id = :studentId", { studentId });
    }
    return query.getOne();
  }

  /**
   * Get the assessments associated with an application.
   * @param applicationId application id.
   * @param triggerType optional type to filter.
   * @returns filtered assessments. Please note that 'Original assessment'
   * will always return only one record.
   */
  async getAssessmentsByApplicationId(
    applicationId: number,
    triggerType?: AssessmentTriggerType,
  ): Promise<StudentAssessment[]> {
    const query = this.repo
      .createQueryBuilder("assessment")
      .select(["assessment.id"])
      .innerJoin("assessment.application", "application")
      .where("application.id = :applicationId", { applicationId });
    if (triggerType) {
      query.andWhere("assessment.triggerType = :triggerType", { triggerType });
    }
    return query.getMany();
  }

  /**
   * Updates Program Information Request (PIR) related data.
   * @param assessmentId assessment id to be updated.
      * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param locationId location id related to the offering.
   * @param status status of the program information request.

   * @param programId program id related to the application.
   * When the application is required for PIR this program is used to assign
   * offering on PIR confirmation.
   * @returns program info update result.
   */
  async updateProgramInfo(
    assessmentId: number,
    auditUserId: number,
    locationId: number,
    status: ProgramInfoStatus,
    programId?: number,
  ): Promise<StudentAssessment> {
    const assessment = await this.repo
      .createQueryBuilder("assessment")
      .select(["assessment.id", "application.id", "student.id"])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .where("assessment.id = :assessmentId", { assessmentId })
      .getOne();

    if (!assessment) {
      throw new CustomNamedError(
        `Not able to find the assessment id ${assessmentId}`,
        ASSESSMENT_NOT_FOUND,
      );
    }
    const auditUser = { id: auditUserId } as User;
    assessment.application.location = {
      id: locationId,
    } as InstitutionLocation;
    assessment.application.pirProgram = { id: programId } as EducationProgram;
    assessment.application.pirStatus = status;
    assessment.application.modifier = auditUser;
    assessment.modifier = auditUser;

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
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType === AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.submitted
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.submitted}'. Assessment id ${assessmentId}`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    if (
      assessment.triggerType !== AssessmentTriggerType.OriginalAssessment &&
      assessment.application.applicationStatus !== ApplicationStatus.completed
    ) {
      throw new CustomNamedError(
        `An assessment with a trigger type other than '${AssessmentTriggerType.OriginalAssessment}' can only be started with a Student Application in the status '${ApplicationStatus.completed}'. Assessment id ${assessmentId}`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }

    await this.workflow.startApplicationAssessment(
      assessment.application.data.workflowName,
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

  /**
   * Updates assessment and application statuses when
   * the student is confirming the NOA (Notice of Assessment).
   * @param assessmentId assessment id to be updated.
   * @param studentId student confirming the NOA.
   * @param auditUserId user who is making the changes.
   * @returns updated record.
   */
  async studentConfirmAssessment(
    assessmentId: number,
    studentId: number,
    auditUserId: number,
  ): Promise<StudentAssessment> {
    const assessment = await this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "application.id",
        "application.applicationStatus",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .where("assessment.id = :assessmentId", { assessmentId })
      .andWhere("student.id = :studentId", { studentId })
      .getOne();

    if (!assessment) {
      throw new CustomNamedError(
        "Not able to find the assessment for the student.",
        ASSESSMENT_NOT_FOUND,
      );
    }

    if (
      assessment.application.applicationStatus !== ApplicationStatus.assessment
    ) {
      throw new CustomNamedError(
        `Application status expected to be '${ApplicationStatus.assessment}' to allow the NOA confirmation.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    assessment.noaApprovalStatus = AssessmentStatus.completed;
    assessment.application.applicationStatus = ApplicationStatus.enrollment;
    // Populate the audit fields.
    assessment.application.modifier = auditUser;
    assessment.application.updatedAt = now;
    assessment.modifier = auditUser;
    assessment.updatedAt = now;
    return this.repo.save(assessment);
  }

  /**
   * Get all assessments history summary but avoid returning it if
   * there is a declined or pending exception.
   * Here we have added different when statement
   * in CASE to fetch the status of the assessment.
   * * WHEN 1: if assessmentWorkflowId is null,
   * * then status is Submitted.
   * * WHEN 2: if assessmentWorkflowId is not null
   * * and assessmentData is null, then status is
   * * InProgress.
   * * WHEN 3:if assessmentWorkflowId is not null
   * * and assessmentData is not null, then status
   * * is Completed.
   * @param applicationId applicationId.
   * @returns AssessmentHistory list
   */
  async assessmentHistorySummary(
    applicationId: number,
  ): Promise<AssessmentHistory[]> {
    const queryResult = await this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.id",
        "assessment.submittedDate",
        "assessment.triggerType",
        "assessment.assessmentDate",
        "offering.id",
        "educationProgram.id",
        "studentAppeal.id",
        "studentScholasticStanding.id",
        "application.id",
        "applicationException.id",
      ])
      .addSelect(
        `CASE
          WHEN 
            assessment.assessmentWorkflowId IS NULL 
            THEN 
              '${StudentAssessmentStatus.Submitted}'
          WHEN 
            assessment.assessmentWorkflowId IS NOT NULL 
            AND 
            assessment.assessmentData IS NULL 
            THEN 
              '${StudentAssessmentStatus.InProgress}'
          WHEN 
            assessment.assessmentWorkflowId IS NOT NULL 
            AND 
            assessment.assessmentData IS NOT NULL 
            THEN 
              '${StudentAssessmentStatus.Completed}'
        END`,
        "status",
      )
      .innerJoin("assessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("assessment.application", "application")
      .leftJoin("assessment.studentAppeal", "studentAppeal")
      .leftJoin(
        "assessment.studentScholasticStanding",
        "studentScholasticStanding",
      )
      .leftJoin("application.applicationException", "applicationException")
      .where("application.id = :applicationId", { applicationId })
      .andWhere(
        new Brackets((qb) =>
          qb
            .where("applicationException.id IS NULL")
            .orWhere(
              "applicationException.exceptionStatus = :exceptionStatus",
              {
                exceptionStatus: ApplicationExceptionStatus.Approved,
              },
            ),
        ),
      )
      .orderBy("status", "DESC")
      .addOrderBy("assessment.submittedDate", "DESC")
      .getRawAndEntities();

    return mapFromRawAndEntities<AssessmentHistory>(queryResult, "status");
  }

  /**
   * Checks if some student assessment is still being processed.
   * Only one student assessment can be processed at a given time because
   * any assessment can generate Over Awards and they must be taken into
   * the consideration every time.
   * * Alongside with the check, the DB has an index to prevent that a new
   * * assessment record is created when there is already one with the
   * * assessment data not populated (submitted/pending).
   * @param application application to have the assessments verified.
   * @returns true if there is an assessment that is not finalized yet.
   */
  async hasIncompleteAssessment(application: number): Promise<boolean> {
    const queryResult = await this.repo
      .createQueryBuilder("assessment")
      .select("1")
      .innerJoin("assessment.application", "application")
      .andWhere("application.id = :application", { application })
      .andWhere("assessment.assessmentData IS NULL")
      .limit(1)
      .getRawOne();
    return !!queryResult;
  }

  /**
   * Validate if the student has any student assessment that it is not
   * finished yet (submitted/pending). If there is a student assessment
   * already being processed, throws an exception.
   * @param application application to have the assessments verified.
   */
  async assertAllAssessmentsCompleted(application: number) {
    const hasIncompleteAssessment = await this.hasIncompleteAssessment(
      application,
    );
    if (hasIncompleteAssessment) {
      throw new CustomNamedError(
        "There is already an assessment waiting to be completed. Another assessment cannot be initiated at this time.",
        ASSESSMENT_ALREADY_IN_PROGRESS,
      );
    }
  }
}
