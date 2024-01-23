import { Injectable } from "@nestjs/common";
import { Brackets, DataSource, Repository } from "typeorm";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  StudentAssessment,
  User,
} from "@sims/sims-db";
import { InjectRepository } from "@nestjs/typeorm";
import { SequencedApplications, SequentialApplication } from "..";

@Injectable()
export class AssessmentSequentialProcessingService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentAssessment)
    private readonly studentAssessmentRepo: Repository<StudentAssessment>,
  ) {}

  async assessImpactedApplicationReassessmentNeeded(
    assessmentId: number,
    auditUserId: number,
  ): Promise<Application | null> {
    const assessmentBeingChecked = await this.studentAssessmentRepo.findOne({
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
    const sequencedApplications = await this.getSequencedApplications(
      assessmentBeingChecked.application.applicationNumber,
      assessmentBeingChecked.application.student.id,
      assessmentBeingChecked.application.programYear.id,
    );
    if (!sequencedApplications.future.length) {
      // There are no future applications impacted.
      return null;
    }
    // Create the reassessment for the next impacted application.
    const [futureSequencedApplication] = sequencedApplications.future;
    const impactedApplication = new Application();
    impactedApplication.id = futureSequencedApplication.applicationCurrentId;
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

  private async getSequencedApplications(
    applicationNumber: string,
    studentId: number,
    programYearId: number,
  ): Promise<SequencedApplications> {
    const sequentialApplicationsSubQuery = this.dataSource
      .createQueryBuilder()
      .select(
        "LAST_VALUE(application.id) OVER (PARTITION BY application.application_number ORDER BY application.id)",
        "application_current_id",
      )
      .addSelect(
        "LAST_VALUE(application.application_status) OVER (PARTITION BY application.application_number ORDER BY application.id)",
        "application_current_status",
      )
      .addSelect("application.application_number", "application_number")
      .addSelect("application.student_id", "student_id")
      .addSelect(
        "studentAssessment.assessment_date",
        "reference_assessment_date",
      )
      .addSelect(
        "studentAssessment.offering_id",
        "current_assessment_offering_id",
      )
      .addSelect(
        "ROW_NUMBER() OVER (PARTITION BY application.application_number ORDER BY studentAssessment.assessment_date)",
        "assessment_calculation_order",
      )
      .from(Application, "application")
      .innerJoin("application.studentAssessments", "studentAssessment")
      .where("studentAssessment.assessmentDate IS NOT NULL")
      .andWhere("application.student_id = :studentId")
      .andWhere("application.program_year_id = :programYearId")
      .getQuery();
    const sequentialApplications = await this.dataSource
      .createQueryBuilder()
      .select("application_number", "applicationNumber")
      .addSelect("application_current_id", "applicationCurrentId")
      .addSelect("application_current_status", "applicationCurrentStatus")
      .addSelect("reference_assessment_date", "referenceAssessmentDate")
      .addSelect(
        "current_assessment_offering_id",
        "currentAssessmentOfferingId",
      )
      .from(`(${sequentialApplicationsSubQuery})`, "sequential_applications")
      .where("sequential_applications.assessment_calculation_order = 1")
      .andWhere(
        new Brackets((qb) =>
          qb
            .where(
              "sequential_applications.application_current_status = :applicationStatus",
              { applicationStatus: ApplicationStatus.Completed },
            )
            .orWhere(
              "sequential_applications.application_number = :applicationNumber",
              { applicationNumber },
            ),
        ),
      )
      .orderBy("sequential_applications.reference_assessment_date")
      .setParameters({ studentId, programYearId })
      .getRawMany<SequentialApplication>();
    return new SequencedApplications(applicationNumber, sequentialApplications);
  }
}
