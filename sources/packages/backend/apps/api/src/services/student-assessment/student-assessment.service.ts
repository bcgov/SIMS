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
  StudentAssessmentStatus,
} from "@sims/sims-db";
import { Brackets, DataSource } from "typeorm";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { CustomNamedError, QueueNames } from "@sims/utilities";
import {
  ASSESSMENT_ALREADY_IN_PROGRESS,
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "./student-assessment.constants";
import { AssessmentHistory } from "./student-assessment.models";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    dataSource: DataSource,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
  ) {
    super(dataSource.getRepository(StudentAssessment));
  }

  /**
   * Get the assessment data to load the NOA (Notice of Assessment)
   * for a student application.
   * @param assessmentId assessment id to be retrieved.
   * @param options options for the query:
   * - `studentId` student associated to the application. Provided
   * when an authorization check is needed.
   * - `applicationId`, application id.
   * @returns assessment NOA data.
   */
  async getAssessmentForNOA(
    assessmentId: number,
    options?: {
      studentId?: number;
      applicationId?: number;
    },
  ): Promise<StudentAssessment> {
    const query = this.repo
      .createQueryBuilder("assessment")
      .select([
        "assessment.assessmentData",
        "assessment.noaApprovalStatus",
        "application.id",
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
        "disbursementSchedule.id",
        "disbursementSchedule.documentNumber",
        "disbursementSchedule.disbursementDate",
        "disbursementSchedule.disbursementScheduleStatus",
        "disbursementSchedule.coeStatus",
        "disbursementSchedule.tuitionRemittanceRequestedAmount",
        "msfaaNumber.id",
        "msfaaNumber.msfaaNumber",
        "msfaaNumber.dateSigned",
        "msfaaNumber.cancelledDate",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("assessment.offering", "offering")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("educationProgram.institution", "institution")
      .innerJoin("offering.institutionLocation", "location")
      .innerJoin("assessment.disbursementSchedules", "disbursementSchedule")
      .innerJoin("disbursementSchedule.msfaaNumber", "msfaaNumber")
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("assessment.id = :assessmentId", { assessmentId })
      .orderBy("disbursementSchedule.disbursementDate");

    if (options?.studentId) {
      query.andWhere("student.id = :studentId", {
        studentId: options?.studentId,
      });
    }
    if (options?.applicationId) {
      query.andWhere("application.id = :applicationId", {
        applicationId: options?.applicationId,
      });
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
      assessment.application.applicationStatus !== ApplicationStatus.Assessment
    ) {
      throw new CustomNamedError(
        `Application status expected to be '${ApplicationStatus.Assessment}' to allow the NOA confirmation.`,
        ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
      );
    }
    const auditUser = { id: auditUserId } as User;
    const now = new Date();
    assessment.noaApprovalStatus = AssessmentStatus.completed;
    assessment.application.applicationStatus = ApplicationStatus.Enrolment;
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
   * @param applicationId application id.
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
        "applicationOfferingChangeRequest.id",
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
        "assessment.applicationOfferingChangeRequest",
        "applicationOfferingChangeRequest",
      )
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
}
