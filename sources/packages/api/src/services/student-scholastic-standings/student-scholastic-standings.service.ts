import { Injectable } from "@nestjs/common";
import { RecordDataModelService } from "../../database/data.model.service";
import { Connection, Repository } from "typeorm";
import { StudentScholasticStanding } from "../../database/entities/student-scholastic-standing.model";
import {
  Application,
  ApplicationStatus,
  AssessmentTriggerType,
  EducationProgramOffering,
  OfferingIntensity,
  OfferingTypes,
  StudentAssessment,
  StudentRestriction,
  User,
} from "../../database/entities";
import { CustomNamedError } from "../../utilities";
import {
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "../application/application.service";
import { ScholasticStanding } from "./student-scholastic-standings.model";
import { StudentAssessmentService } from "../student-assessment/student-assessment.service";
import { StudentRestrictionService } from "../restriction/student-restriction.service";
import { RestrictionCode } from "../restriction/constants";
// When student select "Student did not complete program", then "scholasticStanding" value is
const SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM =
  "studentDidNotCompleteProgram";
// When student select "Student withdrew from program", then "scholasticStanding" value is
const SCHOLASTIC_STANDING_STUDENT_WITHDREW_FROM_PROGRAM =
  "studentWithdrewFromProgram";
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../constants";

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
    private readonly studentRestrictionService: StudentRestrictionService,
  ) {
    super(connection.getRepository(StudentScholasticStanding));
    this.applicationRepo = connection.getRepository(Application);
    this.offeringRepo = connection.getRepository(EducationProgramOffering);
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

    if (application.isArchived) {
      throw new CustomNamedError(
        "This application is no longer eligible to request changes.",
        APPLICATION_CHANGE_NOT_ELIGIBLE,
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

      //TODO: Check for restrictions and apply if any.
      const studentRestriction = await this.studentRestrictionIfExist(
        scholasticStandingData,
        existingOffering.offeringIntensity,
        application.studentId,
        auditUserId,
        applicationId,
      );
      await transactionalEntityManager
        .getRepository(StudentRestriction)
        .save(studentRestriction);

      // Cloning existing offering.
      const offering: EducationProgramOffering = { ...existingOffering };

      // Assigning id as undefined, so that when its saved its considered as a new EducationProgramOffering object.
      offering.id = undefined;
      // todo: UnsuccessfulWeeks does not need reassessment
      const newStudyEndDate =
        scholasticStandingData.dateOfChange ??
        scholasticStandingData.dateOfCompletion ??
        // scholasticStandingData.dateOfIncompletion ??
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

      offering.offeringType = OfferingTypes.ScholasticStanding;

      // Save new offering.
      const savedOffering = await transactionalEntityManager
        .getRepository(EducationProgramOffering)
        .save(offering);

      // Create StudentScholasticStanding.
      const scholasticStanding = new StudentScholasticStanding();
      scholasticStanding.application = { id: applicationId } as Application;
      scholasticStanding.submittedData = scholasticStandingData;
      scholasticStanding.submittedDate = now;
      scholasticStanding.submittedBy = auditUser;
      scholasticStanding.creator = auditUser;

      // Reference offering id.
      scholasticStanding.referenceOffering = existingOffering;

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

      // Set archive to true
      application.isArchived = true;

      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      return studentScholasticStanding;
    });
  }
  // todo add comments
  async studentRestrictionIfExist(
    scholasticStandingData: ScholasticStanding,
    offeringIntensity: OfferingIntensity,
    studentId: number,
    auditUserId: number,
    applicationId: number,
  ): Promise<StudentRestriction> {
    console.log(scholasticStandingData, offeringIntensity, studentId);
    if (offeringIntensity === OfferingIntensity.fullTime) {
      // TODO: CHECK THE INCOMPLETION AND UNSUCCESSFUL FORM FIELDS
      if (
        scholasticStandingData.scholasticStanding ===
        SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM
      ) {
      } else if (
        scholasticStandingData.scholasticStanding ===
        SCHOLASTIC_STANDING_STUDENT_WITHDREW_FROM_PROGRAM
      ) {
        // Check if "WTHD" restriction is already present for the student,
        // if not add "WTHD" restriction else add "SSR" restriction.
        const isWTHDExists =
          await this.studentRestrictionService.isRestrictionExistsForStudent(
            studentId,
            RestrictionCode.WTHD,
          );
        if (isWTHDExists) {
          return this.studentRestrictionService.saveNewStudentRestriction(
            studentId,
            RestrictionCode.SSR,
            auditUserId,
            applicationId,
          );
        }
        return this.studentRestrictionService.saveNewStudentRestriction(
          studentId,
          RestrictionCode.WTHD,
          auditUserId,
          applicationId,
        );
      }
    } else {
      // todo: RECHECK/TEST THE LOGIC
      return this.studentRestrictionService.saveNewStudentRestriction(
        studentId,
        RestrictionCode.PTSSD,
        auditUserId,
        applicationId,
      );
    }
  }
}
