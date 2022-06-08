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
import { APPLICATION_CHANGE_NOT_ELIGIBLE } from "../../constants";

// When student select "Student did not complete program", then "scholasticStanding" value is
const SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM =
  "studentDidNotCompleteProgram";
// When student select "Student withdrew from program", then "scholasticStanding" value is
const SCHOLASTIC_STANDING_STUDENT_WITHDREW_FROM_PROGRAM =
  "studentWithdrewFromProgram";
// Minium unsuccessful weeks.
const MINIMUM_UNSUCCESSFUL_WEEKS = 68;
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

      // Check for restrictions and apply if any.
      const studentRestriction = await this.manageStudentRestrictions(
        scholasticStandingData,
        existingOffering.offeringIntensity,
        application.studentId,
        auditUserId,
        applicationId,
      );

      if (studentRestriction) {
        await transactionalEntityManager
          .getRepository(StudentRestriction)
          .save(studentRestriction);
      }

      // Create StudentScholasticStanding.
      const scholasticStanding = new StudentScholasticStanding();
      scholasticStanding.application = { id: applicationId } as Application;
      scholasticStanding.submittedData = scholasticStandingData;
      scholasticStanding.submittedDate = now;
      scholasticStanding.submittedBy = auditUser;
      scholasticStanding.creator = auditUser;

      // Reference offering id.
      scholasticStanding.referenceOffering = existingOffering;

      // If not unsuccessful weeks, then clone new offering and create re-assessment.
      if (
        scholasticStandingData.scholasticStanding !==
          SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM &&
        !scholasticStandingData.numberOfUnsuccessfulWeeks
      ) {
        // Cloning existing offering.
        const offering: EducationProgramOffering = { ...existingOffering };

        // Assigning id and audit fields as undefined, so that when its saved its considered as a new EducationProgramOffering object.
        offering.id = undefined;
        offering.createdAt = undefined;
        offering.updatedAt = undefined;
        offering.creator = auditUser;
        offering.modifier = auditUser;

        const newStudyEndDate =
          scholasticStandingData.dateOfChange ??
          scholasticStandingData.dateOfCompletion ??
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

        offering.offeringType = OfferingTypes.ScholasticStanding;

        // Save new offering.
        const savedOffering = await transactionalEntityManager
          .getRepository(EducationProgramOffering)
          .save(offering);

        // Create the new assessment to be processed.
        scholasticStanding.studentAssessment = {
          application: { id: applicationId } as Application,
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          creator: auditUser,
          submittedBy: auditUser,
          submittedDate: now,
          offering: { id: savedOffering.id } as EducationProgramOffering,
        } as StudentAssessment;
      } else {
        // If unsuccessful weeks, then add to the column.
        // * No cloning of offering and re-assessment is required in this scenario.
        scholasticStanding.unsuccessfulWeeks =
          scholasticStandingData.numberOfUnsuccessfulWeeks;
      }

      const studentScholasticStanding = await transactionalEntityManager
        .getRepository(StudentScholasticStanding)
        .save(scholasticStanding);

      if (scholasticStanding.studentAssessment) {
        // Save current assessment to application, if any.
        application.currentAssessment = {
          id: scholasticStanding.studentAssessment.id,
        } as StudentAssessment;
      }

      // Set archive to true
      application.isArchived = true;

      // Save current application.
      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      return studentScholasticStanding;
    });
  }

  /**
   * The service process the payload data and checks for certain restriction,
   * and add new restrictions, if required.
   * When institution report withdrawal for a FT course application,
   * add WTHD restriction to student.
   * When institution report Withdrawal for a FT course on a student WITH a WTHD
   * restriction add SSR restriction.
   * When institution reports a change related to a FT application for unsuccessful
   * completion and the total number of unsuccessful weeks hits minimum 68, add SSR
   * restriction.
   * When institution report Withdrawal OR unsuccessful for a PT course application,
   * add PTSSR restriction to student.
   * If a ministry user resolves the SSR or PTSSR or WTHD restriction, and new withdrawal
   * is reported, re add the above restrictions.
   * If a ministry user resolves the SSR restriction, and new unsuccessful completion
   * is reported, add the restriction (minimum is still at least 68).
   * @param scholasticStandingData scholastic standing data.
   * @param offeringIntensity offering intensity.
   * @param studentId student id.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param applicationId application id.
   * @returns a new student restriction object, that need to be saved.
   */
  async manageStudentRestrictions(
    scholasticStandingData: ScholasticStanding,
    offeringIntensity: OfferingIntensity,
    studentId: number,
    auditUserId: number,
    applicationId: number,
  ): Promise<StudentRestriction> {
    if (
      offeringIntensity === OfferingIntensity.fullTime &&
      scholasticStandingData.scholasticStanding ===
        SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM &&
      !!scholasticStandingData.numberOfUnsuccessfulWeeks
    ) {
      const totalExistingUnsuccessfulWeeks =
        await this.totalExistingFTUnsuccessfulWeeks(studentId);

      // When total number of unsuccessful weeks hits minimum 68, add SSR restriction.
      if (
        +(totalExistingUnsuccessfulWeeks ?? 0) +
          +(scholasticStandingData.numberOfUnsuccessfulWeeks ?? 0) >=
        MINIMUM_UNSUCCESSFUL_WEEKS
      ) {
        return this.studentRestrictionService.saveNewStudentRestriction(
          studentId,
          RestrictionCode.SSR,
          auditUserId,
          applicationId,
        );
      }
    } else if (
      offeringIntensity === OfferingIntensity.fullTime &&
      scholasticStandingData.scholasticStanding ===
        SCHOLASTIC_STANDING_STUDENT_WITHDREW_FROM_PROGRAM &&
      !!scholasticStandingData.dateOfWithdrawal
    ) {
      // Check if "WTHD" restriction is already present for the student,
      // if not add "WTHD" restriction else add "SSR" restriction.
      const isWTHDAlreadyExists =
        await this.studentRestrictionService.isRestrictionExistsForStudent(
          studentId,
          RestrictionCode.WTHD,
        );
      if (isWTHDAlreadyExists) {
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
    } else if (
      offeringIntensity === OfferingIntensity.partTime &&
      ((scholasticStandingData.scholasticStanding ===
        SCHOLASTIC_STANDING_STUDENT_DID_NOT_COMPLETE_PROGRAM &&
        !!scholasticStandingData.numberOfUnsuccessfulWeeks) ||
        (scholasticStandingData.scholasticStanding ===
          SCHOLASTIC_STANDING_STUDENT_WITHDREW_FROM_PROGRAM &&
          !!scholasticStandingData.dateOfWithdrawal))
    ) {
      return this.studentRestrictionService.saveNewStudentRestriction(
        studentId,
        RestrictionCode.PTSSR,
        auditUserId,
        applicationId,
      );
    }
  }

  /**
   * The service gets sum of unsuccessfulWeeks for all existing scholastic standing for the
   * requested student.
   * @param studentId student id.
   * @returns sum of unsuccessfulWeeks for all existing scholastic standing for the
   * requested student.
   */
  async totalExistingFTUnsuccessfulWeeks(studentId: number): Promise<number> {
    const query = await this.repo
      .createQueryBuilder("studentScholasticStanding")
      .select("SUM(studentScholasticStanding.unsuccessfulWeeks)")
      .innerJoin("studentScholasticStanding.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("studentScholasticStanding.referenceOffering", "offering")
      .where("student.id = :studentId", { studentId })
      .andWhere("offering.offeringIntensity = :offeringIntensity", {
        offeringIntensity: OfferingIntensity.fullTime,
      })
      .getRawOne();
    return query?.sum;
  }
}
