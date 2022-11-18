import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  ApplicationExceptionStatus,
  ApplicationStatus,
  AssessmentStatus,
  AssessmentTriggerType,
  StudentAssessment,
  User,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { Brackets, DataSource } from "typeorm";
import { CustomNamedError, addDays, dateEqualTo } from "@sims/utilities";
//import { InjectQueue } from "@nestjs/bull";
//import { Queue } from "bull";
import {
  ASSESSMENT_ALREADY_IN_PROGRESS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "./student-assessment.constants";
import {
  AssessmentHistory,
  StudentAssessmentStatus,
} from "./student-assessment.models";
//import { Queues, StartAssessmentQueueInDTO } from "@sims/queue";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    dataSource: DataSource,
    //@InjectQueue(Queues.StartApplicationAssessment.name)
    //private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
  ) {
    super(dataSource.getRepository(StudentAssessment));
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
        "assessment.noaApprovalStatus",
        "application.applicationNumber",
        "application.applicationStatus",
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
        "disbursementSchedule.documentNumber",
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
   * Get the pending assessment for the institutions which have integration true for the particular date.
   * @param generatedDate Date in which the assessment for
   * particular institution is generated.
   * @returns Pending assessment for the institution location.
   */
  async getPendingAssessment(
    generatedDate?: string,
  ): Promise<StudentAssessment[]> {
    const processingDate = generatedDate
      ? new Date(generatedDate)
      : addDays(-1);
    return this.repo.find({
      select: {
        id: true,
        application: {
          applicationNumber: true,
          student: {
            sinValidation: { sin: true },
            user: { lastName: true, firstName: true },
            birthDate: true,
          },
        },
        offering: {
          educationProgram: {
            name: true,
            description: true,
            credentialType: true,
            cipCode: true,
            nocCode: true,
            sabcCode: true,
            institutionProgramCode: true,
          },
          yearOfStudy: true,
          studyStartDate: true,
          studyEndDate: true,
          actualTuitionCosts: true,
          programRelatedCosts: true,
          mandatoryFees: true,
          exceptionalExpenses: true,
          studyBreaks: { totalFundedWeeks: true },
        },
        disbursementSchedules: {
          id: true,
          disbursementValues: { id: true, valueCode: true, valueAmount: true },
        },
      },
      relations: {
        disbursementSchedules: { disbursementValues: true },
        application: { student: { sinValidation: true, user: true } },
        offering: { institutionLocation: true, educationProgram: true },
      },
      where: {
        assessmentDate: dateEqualTo(processingDate),
        offering: { institutionLocation: { hasIntegration: true } },
      },
    });
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

    // await this.startAssessmentQueue.add({
    //   workflowName: assessment.application.data.workflowName,
    //   assessmentId: assessment.id,
    // });
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
   * @param studentId applicant student.
   * @returns AssessmentHistory list
   */
  async assessmentHistorySummary(
    applicationId: number,
    studentId?: number,
  ): Promise<AssessmentHistory[]> {
    const assessmentHistoryQuery = this.repo
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
      );
    if (studentId) {
      assessmentHistoryQuery.andWhere("application.student.id = :studentId", {
        studentId,
      });
    }
    const queryResult = await assessmentHistoryQuery
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
