import { Injectable } from "@nestjs/common";
import { Brackets, DataSource, EntityManager, Not, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementSchedule,
  DisbursementScheduleStatus,
  DisbursementValueType,
  StudentAssessment,
  StudentAssessmentStatus,
  User,
} from "@sims/sims-db";
import { AwardTotal, SequencedApplications, SequentialApplication } from "..";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AssessmentSequentialProcessingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Checks if changes in an assessment can potentially causes changes in another application
   * which would demand a reassessment of the same.
   * @param assessmentId assessment currently changing (e.g. updated or cancelled).
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param options method options.
   * - `entityManager` used to execute the commands in the same transaction.
   * @returns impacted application if any, otherwise null.
   */
  async assessImpactedApplicationReassessmentNeeded(
    assessmentId: number,
    auditUserId: number,
    options?: { entityManager?: EntityManager },
  ): Promise<Application | null> {
    const entityManager = options?.entityManager ?? this.dataSource.manager;
    const applicationRepo = entityManager.getRepository(Application);
    // Application which current assessment is the assessmentId to be checked.
    // If the assessment id is not associated with the current application's assessment
    // no need to check for impacts on future applications.
    const application = await applicationRepo.findOne({
      select: {
        id: true,
        applicationNumber: true,
        programYear: {
          id: true,
        },
        student: {
          id: true,
        },
        currentAssessment: {
          id: true,
          triggerType: true,
          relatedApplicationAssessment: {
            id: true,
          },
        },
      },
      relations: {
        student: true,
        programYear: true,
        currentAssessment: {
          relatedApplicationAssessment: true,
        },
      },
      where: {
        applicationStatus: Not(ApplicationStatus.Overwritten),
        currentAssessment: {
          id: assessmentId,
        },
      },
    });
    if (!application) {
      // Assessment is not current one or the application is overwritten.
      return null;
    }
    const sequencedApplications = await this.getSequencedApplications(
      application.applicationNumber,
      application.student.id,
      application.programYear.id,
      { entityManager },
    );
    if (!sequencedApplications.future.length) {
      // There are no future applications impacted.
      return null;
    }
    // Create the reassessment for the next impacted application.
    const [futureSequencedApplication] = sequencedApplications.future;
    const impactedApplication = new Application();
    impactedApplication.id = futureSequencedApplication.applicationId;
    const now = new Date();
    // Create the new assessment to be processed.
    const auditUser = { id: auditUserId } as User;
    impactedApplication.modifier = auditUser;
    impactedApplication.updatedAt = now;
    impactedApplication.currentAssessment = {
      application: {
        id: impactedApplication.id,
      } as Application,
      offering: {
        id: futureSequencedApplication.currentAssessmentOfferingId,
      },
      triggerType: AssessmentTriggerType.RelatedApplicationChanged,
      relatedApplicationAssessment: { id: assessmentId } as StudentAssessment,
      creator: auditUser,
      createdAt: now,
      submittedBy: auditUser,
      submittedDate: now,
    } as StudentAssessment;
    return applicationRepo.save(impactedApplication);
  }

  /**
   * Finds all applications before the one related to the {@link assessmentId} provided
   * and returns the sum of all awards associated with non-overwritten applications.
   * Only pending awards or already sent awards will be considered.
   * Only federal and provincial grants are considered.
   * The chronology of the applications is defined by the method {@link getSequencedApplications}.
   * @param assessmentId assessment id to be used as a reference to find the past applications.
   * @param options method options.
   * - `alternativeReferenceDate` date that should be used to determine the order when the
   * {@link assessmentId} used as reference does not have a calculated date yet.
   * @returns list of existing awards and their totals, if any, otherwise it returns an empty array,
   * for instance, if the application is the first application or the only application for the
   * program year.
   */
  async getProgramYearPreviousAwardsTotal(
    assessmentId: number,
    options?: { alternativeReferenceDate?: Date },
  ): Promise<AwardTotal[]> {
    const assessment = await this.studentAssessmentRepo.findOne({
      select: {
        id: true,
        application: {
          id: true,
          applicationNumber: true,
          student: {
            id: true,
          },
          programYear: {
            id: true,
          },
        },
      },
      relations: {
        application: { student: true, programYear: true },
      },
      where: {
        id: assessmentId,
      },
    });
    const sequencedApplications = await this.getSequencedApplications(
      assessment.application.applicationNumber,
      assessment.application.student.id,
      assessment.application.programYear.id,
      { alternativeReferenceDate: options?.alternativeReferenceDate },
    );
    if (!sequencedApplications.previous.length) {
      // There are no past applications.
      return [];
    }
    const applicationNumbers = sequencedApplications.previous.map(
      (application) => application.applicationNumber,
    );
    const totals = await this.studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select("disbursementValue.valueCode", "valueCode")
      .addSelect("SUM(disbursementValue.valueAmount)", "total")
      .innerJoin("studentAssessment.application", "application")
      .innerJoin(
        "studentAssessment.disbursementSchedules",
        "disbursementSchedule",
      )
      .innerJoin("disbursementSchedule.disbursementValues", "disbursementValue")
      .where("application.applicationNumber IN (:...applicationNumbers)", {
        applicationNumbers,
      })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      .andWhere(
        "studentAssessment.studentAssessmentStatus = :completedStudentAssessmentStatus",
        {
          completedStudentAssessmentStatus: StudentAssessmentStatus.Completed,
        },
      )
      .andWhere(
        "disbursementSchedule.disbursementScheduleStatus != :cancelledDisbursementScheduleStatus",
        {
          cancelledDisbursementScheduleStatus:
            DisbursementScheduleStatus.Cancelled,
        },
      )
      .andWhere("disbursementSchedule.coeStatus != :declinedCOEStatus", {
        declinedCOEStatus: COEStatus.declined,
      })
      .andWhere("disbursementValue.valueType IN (:...grantsValueTypes)", {
        grantsValueTypes: [
          DisbursementValueType.CanadaGrant,
          DisbursementValueType.BCGrant,
        ],
      })
      .getRawMany<{ valueCode: string; total: string }>();
    // Parses the values from DB ensuring that the total will be properly converted to a number.
    // The valueAmount from awards are mapped to string by Typeorm Postgres driver.
    return totals.map((total) => ({
      valueCode: total.valueCode,
      total: +total.total,
    }));
  }

  /**
   * Get the application correspondent to the {@link applicationNumber} as the current to then search
   * for applications in the past and in the future for the same student and the same program year.
   * If a reference date is not possible to be determined for the current application so no future
   * or past applications will be returned.
   * @param applicationNumber reference application to be used to determined past and future
   * applications and the one to be considered as current for the {@link SequencedApplications}.
   * @param studentId student id.
   * @param programYearId program id to be considered.
   * @param options method options.
   * - `entityManager` used to execute the commands in the same transaction.
   * - `alternativeReferenceDate` date that should be used to determine the order when the
   * {@link applicationNumber} used as reference does not have a calculated date yet.
   * @returns sequenced applications.
   */
  private async getSequencedApplications(
    applicationNumber: string,
    studentId: number,
    programYearId: number,
    options?: {
      entityManager?: EntityManager;
      alternativeReferenceDate?: Date;
    },
  ): Promise<SequencedApplications> {
    const entityManager = options?.entityManager ?? this.dataSource.manager;
    // Sub query to get the first assessment calculation date for an application to be used for ordering.
    // All applications versions should be considered, which means 'Overwritten' also.
    // This will ensure that once the application is calculated for the first time its
    // order in the sequence will never change.
    const assessmentDateSubQuery = entityManager
      .getRepository(StudentAssessment)
      .createQueryBuilder("assessment")
      .select("assessment.assessmentDate")
      .innerJoin("assessment.application", "subQueryApplication")
      .where(
        "subQueryApplication.applicationNumber = application.applicationNumber",
      )
      .orderBy("assessment.assessmentDate")
      .limit(1)
      .getQuery();
    // Sub query to determined if the assessment has at least one non-declined COE (Required or Completed).
    // If all the COEs from the assessment are declined some user action will be needed in the application
    // and this application will not be considered for sequential processing.
    const existsValidCOE = entityManager
      .getRepository(DisbursementSchedule)
      .createQueryBuilder("disbursementSchedule")
      .select("1")
      .where("disbursementSchedule.studentAssessment.id = currentAssessment.id")
      .andWhere("disbursementSchedule.coeStatus != :declinedCOEStatus")
      .limit(1)
      .getSql();
    // Returns past, current, and future applications ordered by the first ever executed assessment calculation.
    const referenceAssessmentDateColumn = "referenceAssessmentDate";
    const sequentialApplications = await entityManager
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.id", "applicationId")
      .addSelect("application.applicationNumber", "applicationNumber")
      .addSelect("application.applicationStatus", "applicationStatus")
      .addSelect("currentAssessmentOffering.id", "currentAssessmentOfferingId")
      .addSelect(`(${assessmentDateSubQuery})`, referenceAssessmentDateColumn)
      .innerJoin("application.student", "student")
      .innerJoin("application.programYear", "programYear")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "currentAssessmentOffering")
      .where("student.id = :studentId", { studentId })
      .andWhere("programYear.id = :programYearId", { programYearId })
      .andWhere("application.applicationStatus != :overwrittenStatus", {
        overwrittenStatus: ApplicationStatus.Overwritten,
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            // Conditions to find applications considered before the current application and after.
            // 1. Application should not be cancelled;
            // 2. Current assessment must have a date would indicates that it was calculated.
            // 3. At least one COE must be valid.
            new Brackets((pastOrFutureBracket) =>
              pastOrFutureBracket
                .where("application.applicationStatus != :cancelledStatus", {
                  cancelledStatus: ApplicationStatus.Cancelled,
                })
                .andWhere("currentAssessment.assessmentDate IS NOT NULL")
                .andWhere(`EXISTS (${existsValidCOE})`),
            ),
            // The 'or' condition forces the current application to be returned since its data matters for decisions,
            // for instance, if the current application has no calculation date no future application should be impacted.
          ).orWhere("application.applicationNumber = :applicationNumber", {
            applicationNumber,
          });
        }),
      )
      .setParameters({ declinedCOEStatus: COEStatus.declined })
      .orderBy(`"${referenceAssessmentDateColumn}"`)
      .getRawMany<SequentialApplication>();
    return new SequencedApplications(
      applicationNumber,
      sequentialApplications,
      options?.alternativeReferenceDate,
    );
  }
}
