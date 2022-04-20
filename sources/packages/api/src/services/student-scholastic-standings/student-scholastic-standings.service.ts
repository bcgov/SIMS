import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import { StudentScholasticStanding } from "../../database/entities/student-scholastic-standing.model";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgramOffering,
  OfferingTypes,
  ScholasticStandingStatus,
  StudentAssessment,
  User,
} from "../../database/entities";
import { CustomNamedError } from "../../utilities";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../application/application.service";
import { ScholasticStanding } from "./student-scholastic-standings.model";
import { StudentAssessmentService } from "../student-assessment/student-assessment.service";

/**
 * Manages the student scholastic standings related operations.
 */
@Injectable()
export class StudentScholasticStandingsService extends RecordDataModelService<StudentScholasticStanding> {
  private readonly applicationRepo: Repository<Application>;
  private readonly offeringRepo: Repository<EducationProgramOffering>;

  constructor(
    private readonly connection: Connection,
    private readonly studentAssessmentService: StudentAssessmentService,
  ) {
    super(connection.getRepository(StudentScholasticStanding));
    this.applicationRepo = connection.getRepository(Application);
    this.offeringRepo = connection.getRepository(EducationProgramOffering);
  }

  /**
   * Get all pending and declined scholastic standings
   * for an application.
   * @param applicationId application id.
   * @returns StudentScholasticStanding list.
   */
  getPendingAndDeniedScholasticStanding(
    applicationId: number,
  ): Promise<StudentScholasticStanding[]> {
    return this.repo
      .createQueryBuilder("scholasticStanding")
      .select([
        "scholasticStanding.id",
        "scholasticStanding.scholasticStandingStatus",
        "scholasticStanding.submittedDate",
      ])
      .innerJoin("scholasticStanding.application", "application")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("scholasticStanding.scholasticStandingStatus != :status", {
        status: ScholasticStandingStatus.Approved,
      })
      .getMany();
  }

  /**
   * Save scholastic standing and create new assessment
   * for an application.
   * @param locationId location id.
   * @param applicationId application id.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param scholasticStandingData scholastic standing data to be saved.
   */
  async saveScholasticStandingCreateReassessment(
    locationId: number,
    applicationId: number,
    auditUserId: number,
    scholasticStandingData: ScholasticStanding,
  ): Promise<StudentScholasticStanding> {
    const application = await this.applicationRepo
      .createQueryBuilder("application")
      .select(["application", "currentAssessment.id", "offering.id"])
      .innerJoin("application.currentAssessment", "currentAssessment")
      .innerJoin("currentAssessment.offering", "offering")
      .innerJoin("application.location", "location")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("location.id = :locationId", { locationId })
      .getOne();

    if (!application) {
      throw new CustomNamedError(
        "Application Not found or invalid current assessment or offering.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.completed) {
      throw new CustomNamedError(
        "Cannot report a change for application with status other than completed.",
        INVALID_OPERATION_IN_THE_CURRENT_STATUS,
      );
    }
    // Check if any assessment already in progress for this application.
    await this.studentAssessmentService.assertAllAssessmentsCompleted(
      application.id,
    );

    return this.connection.transaction(async (transactionalEntityManager) => {
      const now = new Date();
      const auditUser = { id: auditUserId } as User;

      // Get existing offering.
      const existingOffering = await this.offeringRepo
        .createQueryBuilder("offering")
        .select(["offering", "educationProgram.id", "institutionLocation.id"])
        .where("offering.id = :offeringId", {
          offeringId: application.currentAssessment.offering.id,
        })
        .innerJoin("offering.educationProgram", "educationProgram")
        .innerJoin("offering.institutionLocation", "institutionLocation")
        .getOne();

      // Cloning existing offering.
      const offering: EducationProgramOffering = { ...existingOffering };

      /// Assigning id as undefined, so that when its saved its considered as a new EducationProgramOffering object.
      offering.id = undefined;

      const newStudyEndDate =
        scholasticStandingData.dateOfChange ??
        scholasticStandingData.dateOfCompletion ??
        scholasticStandingData.dateOfIncompletion ??
        scholasticStandingData.dateOfWithdrawal;

      offering.studyEndDate = new Date(newStudyEndDate);

      offering.actualTuitionCosts =
        scholasticStandingData.tuition ?? existingOffering.actualTuitionCosts;
      offering.programRelatedCosts =
        scholasticStandingData.booksAndSupplies ??
        existingOffering.programRelatedCosts;
      offering.mandatoryFees =
        scholasticStandingData.mandatoryFees ?? existingOffering.mandatoryFees;
      offering.exceptionalExpenses =
        scholasticStandingData.exceptionalCosts ??
        existingOffering.exceptionalExpenses;

      // TODO: When new offering type is added for report a change/ scholastic standing, update this.
      offering.offeringType = OfferingTypes.applicationSpecific;

      // Save new offering.
      const savedOffering = await transactionalEntityManager
        .getRepository(EducationProgramOffering)
        .save(offering);

      // Create StudentScholasticStanding.
      const scholasticStanding = new StudentScholasticStanding();
      scholasticStanding.application = { id: applicationId } as Application;
      scholasticStanding.submittedData = scholasticStandingData;
      scholasticStanding.submittedDate = now;
      scholasticStanding.scholasticStandingStatus =
        ScholasticStandingStatus.Approved;
      scholasticStanding.submittedBy = auditUser;
      scholasticStanding.creator = auditUser;

      // Create the new assessment to be processed.
      scholasticStanding.studentAssessment = {
        application: { id: applicationId } as Application,
        triggerType: AssessmentTriggerType.ScholasticStandingChange,
        creator: auditUser,
        submittedBy: auditUser,
        submittedDate: now,
        offering: { id: savedOffering.id } as EducationProgramOffering,
      } as StudentAssessment;

      const studentScholasticStanding = await transactionalEntityManager
        .getRepository(StudentScholasticStanding)
        .save(scholasticStanding);

      // Save current application.
      application.currentAssessment = {
        id: scholasticStanding.studentAssessment.id,
      } as StudentAssessment;

      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      return studentScholasticStanding;
    });
  }
}
