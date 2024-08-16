import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  User,
  StudentAssessment,
  StudentAssessmentStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import { ConfigService } from "@sims/utilities/config";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class ApplicationService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  /**
   * Archives one or more applications when application archive days
   * configuration have passed the end of the study period.
   * @param auditUserId user making changes to table.
   * @return the number of applications that were archived.
   */
  async archiveApplications(auditUserId: number): Promise<number> {
    const auditUser = { id: auditUserId } as User;

    // Build sql statement to get all application ids to archive
    const applicationsToArchive = this.applicationRepo
      .createQueryBuilder("application")
      .select("application.id")
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .where("application.applicationStatus = :completed")
      .andWhere(
        "(CURRENT_DATE - offering.studyEndDate) > :applicationArchiveDays",
      )
      .andWhere("application.isArchived <> :isApplicationArchived")
      .getSql();

    const updateResult = await this.applicationRepo
      .createQueryBuilder()
      .update(Application)
      .set({ isArchived: true, modifier: auditUser })
      .where(`applications.id IN (${applicationsToArchive})`)
      .setParameter("completed", ApplicationStatus.Completed)
      .setParameter(
        "applicationArchiveDays",
        this.configService.applicationArchiveDays,
      )
      .setParameter("isApplicationArchived", true)
      .execute();

    return updateResult.affected;
  }

  /**
   * Sub query to validate if an application has assessment already being
   * processed by the workflow.
   */
  private inProgressStatusesExistsQuery = this.studentAssessmentRepo
    .createQueryBuilder("studentAssessment")
    .select("1")
    .where("studentAssessment.application.id = application.id")
    .andWhere(
      "studentAssessment.studentAssessmentStatus IN (:...inProgressStatuses)",
    )
    .getQuery();

  /**
   * Finds all applications with some pending student assessment to be
   * processed by the workflow, ignoring applications that already have
   * some workflows in progress or were already queued for execution.
   * All pending student assessments will be returned ordered by its creation
   * date to allow the select of the next one to be executed (usually only one
   * record would be expected).
   * @returns applications with pending assessments to be executed.
   */
  async getApplicationsToStartAssessments(): Promise<Application[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select(["application.id", "studentAssessment.id"])
        .innerJoin("application.studentAssessments", "studentAssessment")
        // currentProcessingAssessment will be null for the original assessment and it must be
        // updated every time that a workflow is triggered.
        // When currentProcessingAssessment and currentAssessment are different it indicates that
        // there is a assessment workflow pending to be executed.
        .where(
          new Brackets((qb) => {
            qb.where("application.currentProcessingAssessment IS NULL").orWhere(
              "application.currentProcessingAssessment != application.currentAssessment",
            );
          }),
        )
        .andWhere("application.applicationStatus IN (:...status)", {
          status: [
            ApplicationStatus.Submitted,
            ApplicationStatus.InProgress,
            ApplicationStatus.Assessment,
            ApplicationStatus.Enrolment,
            ApplicationStatus.Completed,
          ],
        })
        .andWhere(
          "studentAssessment.studentAssessmentStatus = :submittedStatus",
          {
            submittedStatus: StudentAssessmentStatus.Submitted,
          },
        )
        .andWhere(`NOT EXISTS (${this.inProgressStatusesExistsQuery})`)
        .setParameter("inProgressStatuses", [
          StudentAssessmentStatus.Queued,
          StudentAssessmentStatus.InProgress,
          // This conditions may not be directly related to the current application logic but has been added to ensure that
          // at any given time now or future the queue does not pick an application to cancel when there is already an
          // assessment for that application which is queued for cancellation.
          StudentAssessmentStatus.CancellationRequested,
          StudentAssessmentStatus.CancellationQueued,
        ])
        .orderBy("studentAssessment.createdAt")
        .getMany()
    );
  }

  /**
   * Finds all applications with some student assessment with cancellation requested.
   * All student assessments to be cancelled will be returned ordered by its creation
   * date to allow the select of the next one to be cancelled.
   * @returns applications with assessment to be cancelled.
   */
  async getApplicationsToCancelAssessments(): Promise<Application[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select(["application.id", "studentAssessment.id"])
        .innerJoin("application.studentAssessments", "studentAssessment")
        .andWhere("studentAssessment.studentAssessmentStatus = :status", {
          status: StudentAssessmentStatus.CancellationRequested,
        })
        // This condition may not be directly related to the current application logic but has been added to ensure that
        // at any given time now or future the queue does not pick an application to cancel when there is already an
        // assessment for that application which is queued for cancellation.
        .andWhere(`NOT EXISTS (${this.inProgressStatusesExistsQuery})`)
        .setParameter("inProgressStatuses", [
          StudentAssessmentStatus.CancellationQueued,
        ])
        .orderBy("studentAssessment.createdAt")
        .getMany()
    );
  }

  async getDateChangeNotReportedApplication(): Promise<any> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select("application.applicationNumber", "Application Number")
        .addSelect("sinValidation.sin", "Student SIN")
        .addSelect("user.firstName", "Student First Name")
        .addSelect("user.lastName", "Student Last Name")
        .addSelect(
          `CASE WHEN currentOffering.offeringIntensity = '${OfferingIntensity.fullTime}' 
           THEN 'FT' ELSE 'PT' END`,
          "Loan Type",
        )
        .addSelect("", "Education Institution Code")
        // .addSelect("", "Original Study Start Date")
        // .addSelect("", "Original Study End Date")
        // .addSelect("", "Activity")
        // .addSelect("", "Activity Time")
        // .addSelect("", "New Study Start Date")
        // .addSelect("", "New Study End Date")
        .innerJoin("application.student", "student")
        .innerJoin("student.user", "user")
        .innerJoin("student.sinValidation", "sinValidation")
        .innerJoin("application.currentAssessment", "currentAssessment")
        .innerJoin(
          "currentAssessment.previousDateChangedReportedAssessment",
          "previousDateChangedReportedAssessment",
        )
        .leftJoin(
          "currentAssessment.studentScholasticStanding",
          "studentScholasticStanding",
        )
        .innerJoin("currentAssessment.offering", "currentOffering")
        .innerJoin(
          "previousDateChangedReportedAssessment.offering",
          "previousOffering",
        )
        .innerJoin("currentOffering.institutionLocation", "institutionLocation")
        .where("currentAssessment.reportedDate IS NULL")
        .getRawAndEntities()
    );
  }
}
