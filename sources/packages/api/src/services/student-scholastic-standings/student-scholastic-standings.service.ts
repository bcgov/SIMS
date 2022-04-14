import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import { StudentScholasticStanding } from "../../database/entities/student-scholastic-standing.model";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgram,
  EducationProgramOffering,
  InstitutionLocation,
  OfferingTypes,
  ScholasticStandingStatus,
  StudentAssessment,
  User,
} from "../../database/entities";
import { ScholasticStandingAPIInDTO } from "../../route-controllers/institution-locations/models/institution-location.dto";
import { CustomNamedError } from "../../utilities";
import { APPLICATION_NOT_FOUND } from "../application/application.service";
export const NOT_A_COMPLETED_APPLICATION = "NOT_A_COMPLETED_APPLICATION";

/**
 * Manages the student scholastic standings related operations.
 */
@Injectable()
export class StudentScholasticStandingsService extends RecordDataModelService<StudentScholasticStanding> {
  private readonly applicationRepo: Repository<Application>;
  private readonly offeringRepo: Repository<EducationProgramOffering>;

  constructor(private readonly connection: Connection) {
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
   * @param applicationId application id.
   * @param scholasticStandingData scholastic standing data to be saved
   */
  async saveScholasticStandingCreateReassessment(
    applicationId: number,
    userId: number,
    scholasticStandingData: ScholasticStandingAPIInDTO,
  ): Promise<StudentScholasticStanding> {
    const application = await this.applicationRepo
      .createQueryBuilder("application")
      .select(["application", "currentAssessment.id", "offering.id"])
      .where("application.id = :applicationId", { applicationId })
      .leftJoin("application.currentAssessment", "currentAssessment")
      .leftJoin("currentAssessment.offering", "offering")
      .getOne();

    if (!application) {
      throw new CustomNamedError(
        "Application Not found.",
        APPLICATION_NOT_FOUND,
      );
    }

    if (application.applicationStatus !== ApplicationStatus.completed) {
      throw new CustomNamedError(
        "Not a completed application.",
        NOT_A_COMPLETED_APPLICATION,
      );
    }

    return this.connection.transaction(async (transactionalEntityManager) => {
      const now = new Date();
      const auditUser = {
        id: userId,
      } as User;

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

      // Create new offering for student scholastic standing.
      const offering = new EducationProgramOffering();
      offering.name = existingOffering.name;
      offering.studyStartDate = existingOffering.studyStartDate;
      const newStudyEndDate =
        scholasticStandingData.dateOfChange ||
        scholasticStandingData.dateOfCompletion ||
        scholasticStandingData.dateOfIncompletion ||
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

      offering.tuitionRemittanceRequestedAmount =
        existingOffering.tuitionRemittanceRequestedAmount;
      offering.offeringDelivered = existingOffering.offeringDelivered;
      offering.lacksStudyDates = existingOffering.lacksStudyDates;
      offering.lacksStudyBreaks = existingOffering.lacksStudyBreaks;
      offering.lacksFixedCosts = existingOffering.lacksFixedCosts;
      offering.tuitionRemittanceRequested =
        existingOffering.tuitionRemittanceRequested;
      offering.educationProgram = {
        id: existingOffering.educationProgram.id,
      } as EducationProgram;
      offering.institutionLocation = {
        id: existingOffering.institutionLocation.id,
      } as InstitutionLocation;

      // TODO: When new offering type is added for report a change/ scholastic standing, update this
      offering.offeringType = OfferingTypes.applicationSpecific;

      offering.offeringIntensity = existingOffering.offeringIntensity;
      offering.yearOfStudy = existingOffering.yearOfStudy;
      offering.showYearOfStudy = existingOffering.showYearOfStudy;
      offering.hasOfferingWILComponent =
        existingOffering.hasOfferingWILComponent;
      offering.offeringWILType = existingOffering.offeringWILType;
      offering.studyBreaks = existingOffering.studyBreaks;
      offering.offeringDeclaration = existingOffering.offeringDeclaration;

      // Save new offering.
      await transactionalEntityManager
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
        offering: { id: offering.id } as EducationProgramOffering,
      } as StudentAssessment;

      const studentScholasticStandingObj = await transactionalEntityManager
        .getRepository(StudentScholasticStanding)
        .save(scholasticStanding);

      // Save current application
      application.currentAssessment = {
        id: scholasticStanding.studentAssessment.id,
      } as StudentAssessment;

      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      return studentScholasticStandingObj;
    });
  }
}
