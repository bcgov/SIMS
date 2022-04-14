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
import { ScholasticStandingAPIInDTO } from "src/route-controllers/institution-locations/models/institution-location.dto";
import { CustomNamedError } from "src/utilities";
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
   * Save scholasticStanding and create new assessment
   * for an application.
   * @param applicationId application id.
   * @param scholasticStandingData scholasticStanding data to be saved
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

    if (application.applicationStatus !== ApplicationStatus.completed) {
      throw new CustomNamedError(
        "Not a completed application.",
        NOT_A_COMPLETED_APPLICATION,
      );
    }

    const scholasticStanding = await this.connection.transaction(
      async (transactionalEntityManager) => {
        const now = new Date();
        const auditUser = {
          id: userId,
        } as User;

        // get existing offering.
        const existingOffering = await this.offeringRepo
          .createQueryBuilder("offering")
          .select(["offering", "educationProgram.id", "institutionLocation.id"])
          .where("offering.id = :offeringId", {
            offeringId: application.currentAssessment.offering.id,
          })
          .innerJoin("offering.educationProgram", "educationProgram")
          .innerJoin("offering.institutionLocation", "institutionLocation")
          .getOne();
        // create new offering for StudentScholasticStanding.
        const offering = new EducationProgramOffering();
        offering.name = existingOffering.name;
        offering.studyStartDate = existingOffering.studyStartDate;
        // todo: edit below fileds
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
          scholasticStandingData.mandatoryFees ??
          existingOffering.mandatoryFees;
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
        // TODO: when new offering type is added for report a change, update this
        offering.offeringType = OfferingTypes.applicationSpecific;
        offering.offeringIntensity = existingOffering.offeringIntensity;
        offering.yearOfStudy = existingOffering.yearOfStudy;
        offering.showYearOfStudy = existingOffering.showYearOfStudy;
        offering.hasOfferingWILComponent =
          existingOffering.hasOfferingWILComponent;
        offering.offeringWILType = existingOffering.offeringWILType;
        offering.studyBreaks = existingOffering.studyBreaks;
        offering.offeringDeclaration = existingOffering.offeringDeclaration;

        // save new offering.
        await transactionalEntityManager
          .getRepository(EducationProgramOffering)
          .save(offering);

        // create StudentScholasticStanding.
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

        return transactionalEntityManager
          .getRepository(StudentScholasticStanding)
          .save(scholasticStanding);
      },
    );

    application.currentAssessment = {
      id: scholasticStanding.studentAssessment.id,
    } as StudentAssessment;

    await this.applicationRepo.save(application);

    return scholasticStanding;
  }
}
