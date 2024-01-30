import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { SequencedApplications, SequentialApplication } from "..";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class AssessmentSequentialProcessingService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
  ) {}

  /**
   * Checks if changes in an assessment can potentially causes changes in another application
   * which would demand an reassessment of the same.
   * @param assessmentId assessment currently changing (e.g. updated or cancelled).
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns impacted application if any, otherwise null.
   */
  async assessImpactedApplicationReassessmentNeeded(
    assessmentId: number,
    auditUserId: number,
    entityManager: EntityManager,
  ): Promise<Application | null> {
    const studentAssessmentRepo =
      entityManager.getRepository(StudentAssessment);
    const assessmentBeingChecked = await studentAssessmentRepo.findOne({
      select: {
        id: true,
        application: {
          id: true,
          applicationNumber: true,
          programYear: {
            id: true,
          },
          student: {
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
    // If not there is no point checking for impacted apps since no py room was consumed.
    const sequencedApplications = await this.getSequencedApplications(
      assessmentBeingChecked.application.applicationNumber,
      assessmentBeingChecked.application.student.id,
      assessmentBeingChecked.application.programYear.id,
      entityManager,
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
    return this.applicationRepo.save(impactedApplication);
  }

  /**
   *
   * @param applicationNumber reference application to be used to determined past and future
   * applications and the one to be considered as current for the {@link SequencedApplications}.
   * @param studentId student id.
   * @param programYearId program id to be considered.
   * @param entityManager used to execute the commands in the same transaction.
   * @returns sequenced applications.
   */
  private async getSequencedApplications(
    applicationNumber: string,
    studentId: number,
    programYearId: number,
    entityManager: EntityManager,
  ): Promise<SequencedApplications> {
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
    const sequentialApplications = await entityManager
      .getRepository(Application)
      .createQueryBuilder("application")
      .select("application.id", "applicationId")
      .addSelect("application.applicationNumber", "applicationNumber")
      .addSelect("application.applicationStatus", "applicationStatus")
      .addSelect("currentAssessmentOffering.id", "currentAssessmentOfferingId")
      .addSelect(`(${assessmentDateSubQuery})`, "referenceAssessmentDate")
      .innerJoin("application.student", "student")
      .innerJoin("application.programYear", "programYear")
      .innerJoin(
        "application.currentAssessment",
        "currentAssessment",
        "application.applicationStatus != :overwrittenStatus",
        { overwrittenStatus: ApplicationStatus.Overwritten },
      )
      .innerJoin("currentAssessment.offering", "currentAssessmentOffering")
      .where("student.id = :studentId", { studentId })
      .andWhere("programYear.id = :programYearId", { programYearId })
      .andWhere("currentAssessment.assessmentDate IS NOT NULL")
      .andWhere(
        "application.applicationStatus NOT IN (:...applicationsStatuses)",
        {
          applicationsStatuses: [ApplicationStatus.Cancelled],
        },
      )
      .orWhere("application.applicationNumber = :applicationNumber", {
        applicationNumber,
      })
      .setParameters({ studentId, programYearId, applicationNumber })
      .orderBy(`"referenceAssessmentDate"`)
      .getRawMany<SequentialApplication>();
    return new SequencedApplications(applicationNumber, sequentialApplications);
  }

  // /**
  //  *
  //  * @param applicationNumber reference application to be used to determined past and future
  //  * applications and the one to be considered as current for the {@link SequencedApplications}.
  //  * @param studentId student id.
  //  * @param programYearId program id to be considered.
  //  * @param entityManager used to execute the commands in the same transaction.
  //  * @returns sequenced applications.
  //  */
  // private async getSequencedApplications(
  //   applicationNumber: string,
  //   studentId: number,
  //   programYearId: number,
  //   entityManager: EntityManager,
  // ): Promise<SequencedApplications> {
  //   const sequentialApplicationsSubQuery = entityManager
  //     .createQueryBuilder()
  //     // Selects the most updated index for the same application number.
  //     .select(
  //       "LAST_VALUE(application.id) OVER (PARTITION BY application.application_number ORDER BY application.id RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)",
  //       "application_current_id",
  //     )
  //     // Selects the most updated application status for the same application number.
  //     .addSelect(
  //       "LAST_VALUE(application.application_status) OVER (PARTITION BY application.application_number ORDER BY application.id RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)",
  //       "application_current_status",
  //     )
  //     .addSelect("application.application_number", "application_number")
  //     .addSelect("application.student_id", "student_id")
  //     .addSelect(
  //       "studentAssessment.assessment_date",
  //       "reference_assessment_date",
  //     )
  //     // Selects the most updated offering id for the same application number.
  //     .addSelect(
  //       "LAST_VALUE(studentAssessment.offering_id) OVER (PARTITION BY application.application_number ORDER BY studentAssessment.id RANGE BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING)",
  //       "current_assessment_offering_id",
  //     )
  //     // Adds a order number to each record where the first one will be the record with the oldest assessment.
  //     .addSelect(
  //       "ROW_NUMBER() OVER (PARTITION BY application.application_number ORDER BY studentAssessment.assessment_date)",
  //       "assessment_calculation_order",
  //     )
  //     .from(Application, "application")
  //     .innerJoin("application.studentAssessments", "studentAssessment")
  //     .where("application.student_id = :studentId")
  //     .andWhere("application.program_year_id = :programYearId")
  //     .getQuery();
  //   const sequentialApplications = await this.dataSource
  //     .createQueryBuilder()
  //     .select("application_number", "applicationNumber")
  //     .addSelect("application_current_id", "applicationCurrentId")
  //     .addSelect("application_current_status", "applicationCurrentStatus")
  //     .addSelect("reference_assessment_date", "referenceAssessmentDate")
  //     .addSelect(
  //       "current_assessment_offering_id",
  //       "currentAssessmentOfferingId",
  //     )
  //     .from(`(${sequentialApplicationsSubQuery})`, "sequential_applications")
  //     .where("sequential_applications.assessment_calculation_order = 1")
  //     // Ensures that the application had some assessment date produced some point in time.
  //     // Considering an application edited multiple times, if one overwritten application ever had an
  //     // assessment calculation, this date may be used as the reference. If an application never ever had
  //     // an assessment calculation executed then it should not be part of the results.
  //     // TODO: do we need it
  //     .andWhere("sequential_applications.reference_assessment_date IS NOT NULL")
  //     .andWhere(
  //       new Brackets((qb) =>
  //         qb
  //           .where(
  //             "sequential_applications.application_current_status != :applicationStatus",
  //             { applicationStatus: ApplicationStatus.Cancelled },
  //           )
  //           // Ensure that the reference application will always be present in the result.
  //           .orWhere(
  //             "sequential_applications.application_number = :applicationNumber",
  //             { applicationNumber },
  //           ),
  //       ),
  //     )
  //     .orderBy("sequential_applications.reference_assessment_date")
  //     .setParameters({ studentId, programYearId })
  //     .getRawMany<SequentialApplication>();
  //   return new SequencedApplications(applicationNumber, sequentialApplications);
  // }
}
