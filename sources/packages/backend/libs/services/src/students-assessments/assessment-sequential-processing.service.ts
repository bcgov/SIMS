import { Injectable } from "@nestjs/common";
import { Brackets, EntityManager, Not } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  COEStatus,
  DisbursementSchedule,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { SequencedApplications, SequentialApplication } from "..";

@Injectable()
export class AssessmentSequentialProcessingService {
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
      },
      relations: {
        student: true,
        programYear: true,
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
    return applicationRepo.save(impactedApplication);
  }

  /**
   * Get the application correspondent to the {@link applicationNumber} as the current to them search
   * for application in the past and in the future for the same student and the same program year.
   * If a reference date is not possible to be determined for the current application so no future
   * or past applications will be returned.
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
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "currentAssessmentOffering")
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
      .orderBy(`"referenceAssessmentDate"`)
      .getRawMany<SequentialApplication>();
    return new SequencedApplications(applicationNumber, sequentialApplications);
  }
}
