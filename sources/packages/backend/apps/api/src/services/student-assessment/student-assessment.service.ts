import { Injectable } from "@nestjs/common";
import {
  RecordDataModelService,
  ApplicationExceptionStatus,
  ApplicationStatus,
  AssessmentStatus,
  AssessmentTriggerType,
  StudentAssessment,
  User,
  Application,
  StudentAssessmentStatus,
  NoteType,
} from "@sims/sims-db";
import { Brackets, DataSource } from "typeorm";
import { CustomNamedError } from "@sims/utilities";
import {
  ASSESSMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ASSESSMENT_NOT_FOUND,
} from "./student-assessment.constants";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { NoteSharedService } from "@sims/services";
import { ApplicationService } from "../../services";

/**
 * Manages the student assessment related operations.
 */
@Injectable()
export class StudentAssessmentService extends RecordDataModelService<StudentAssessment> {
  constructor(
    private readonly dataSource: DataSource,
    private readonly noteSharedService: NoteSharedService,
    private readonly applicationService: ApplicationService,
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
        "assessment.id",
        "assessment.assessmentData",
        "assessment.noaApprovalStatus",
        "application.id",
        "application.applicationNumber",
        "application.applicationStatus",
        "currentAssessment.id",
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
        "disbursementSchedule.dateSent",
        "msfaaNumber.id",
        "msfaaNumber.msfaaNumber",
        "msfaaNumber.dateSigned",
        "msfaaNumber.cancelledDate",
        "disbursementValue.valueType",
        "disbursementValue.valueCode",
        "disbursementValue.valueAmount",
        "disbursementValue.effectiveAmount",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("application.currentAssessment", "currentAssessment")
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
        "currentAssessment.id",
      ])
      .innerJoin("assessment.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("application.currentAssessment", "currentAssessment")
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

    if (assessment.application.currentAssessment.id !== assessment.id) {
      throw new CustomNamedError(
        `An assessment other than the current one may not be approved.`,
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
   * @param applicationId application id.
   * @param studentId applicant student.
   * @returns AssessmentHistory list
   */
  async assessmentHistorySummary(
    applicationId: number,
    studentId?: number,
  ): Promise<StudentAssessment[]> {
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
        "assessment.studentAssessmentStatus",
      ])
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
    return assessmentHistoryQuery
      .orderBy("assessment.studentAssessmentStatus", "DESC")
      .addOrderBy("assessment.submittedDate", "DESC")
      .getMany();
  }

  /**
   * Creates a manual assessment for the application.
   * @param applicationId application id.
   * @param note note.
   * @param userId user id who triggered the manual reassessment.
   * @returns the assessment created.
   */
  async createManualReassessment(
    applicationId: number,
    note: string,
    userId: number,
  ): Promise<StudentAssessment> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const application =
        await this.applicationService.getApplicationAssessmentStatusDetails(
          applicationId,
          { entityManager: transactionalEntityManager },
        );

      if (!application) {
        throw new CustomNamedError(
          "Application not found.",
          APPLICATION_NOT_FOUND,
        );
      }
      if (application.isArchived) {
        throw new CustomNamedError(
          "Application cannot have manual reassessment after being archived.",
          INVALID_OPERATION_IN_THE_CURRENT_STATUS,
        );
      }
      if (
        [
          ApplicationStatus.Cancelled,
          ApplicationStatus.Overwritten,
          ApplicationStatus.Draft,
        ].includes(application.applicationStatus)
      ) {
        throw new CustomNamedError(
          `Application cannot have manual reassessment in any of the statuses: ${ApplicationStatus.Cancelled}, ${ApplicationStatus.Overwritten} or ${ApplicationStatus.Draft}.`,
          INVALID_OPERATION_IN_THE_CURRENT_STATUS,
        );
      }
      const [originalAssessment] = application.studentAssessments;
      if (
        originalAssessment.studentAssessmentStatus !==
        StudentAssessmentStatus.Completed
      ) {
        throw new CustomNamedError(
          `Application original assessment expected to be '${StudentAssessmentStatus.Completed}' to allow manual reassessment.`,
          INVALID_OPERATION_IN_THE_CURRENT_STATUS,
        );
      }

      await this.noteSharedService.createStudentNote(
        application.student.id,
        NoteType.Application,
        note,
        userId,
        transactionalEntityManager,
      );

      const auditUser = { id: userId } as User;
      const now = new Date();
      const oldCurrentAssessment = application.currentAssessment;
      const applicationToBeSaved = {
        id: application.id,
        modifier: auditUser,
        updatedAt: now,
      } as Application;
      applicationToBeSaved.currentAssessment = {
        application: applicationToBeSaved,
        offering: { id: oldCurrentAssessment.offering.id },
        studentAppeal: oldCurrentAssessment.studentAppeal,
        triggerType: AssessmentTriggerType.ManualReassessment,
        creator: auditUser,
        createdAt: now,
        submittedBy: auditUser,
        submittedDate: now,
      } as StudentAssessment;

      const applicationRepo =
        transactionalEntityManager.getRepository(Application);
      const savedApplication = await applicationRepo.save(applicationToBeSaved);
      return savedApplication.currentAssessment;
    });
  }
}
