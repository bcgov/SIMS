import { Injectable } from "@nestjs/common";
import { Brackets, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  User,
  StudentAssessment,
  StudentAssessmentStatus,
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

  async getApplicationsToStartAssessments(): Promise<Application[]> {
    const inProgressStatusesExistsQuery = this.studentAssessmentRepo
      .createQueryBuilder("studentAssessment")
      .select("1")
      .where("studentAssessment.application.id = application.id")
      .andWhere(
        "studentAssessment.studentAssessmentStatus IN (:...inProgressStatuses)",
      )
      .getQuery();

    return this.applicationRepo
      .createQueryBuilder("application")
      .select("application.id")
      .addSelect("studentAssessment.id")
      .innerJoin("application.studentAssessments", "studentAssessment")
      .where(
        new Brackets((qb) => {
          qb.where("application.currentProcessingAssessment IS NULL").orWhere(
            "application.currentProcessingAssessment != application.currentAssessment",
          );
        }),
      )
      .andWhere(
        "studentAssessment.studentAssessmentStatus = :submittedStatus",
        {
          submittedStatus: StudentAssessmentStatus.Submitted,
        },
      )
      .andWhere(`NOT EXISTS (${inProgressStatusesExistsQuery})`)
      .setParameter("inProgressStatuses", [
        StudentAssessmentStatus.Queued,
        StudentAssessmentStatus.InProgress,
      ])
      .orderBy("studentAssessment.createdAt")
      .getMany();
  }
}
