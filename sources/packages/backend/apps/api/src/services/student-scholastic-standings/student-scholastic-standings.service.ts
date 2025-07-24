import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import {
  RecordDataModelService,
  StudentScholasticStanding,
  Application,
  AssessmentTriggerType,
  EducationProgramOffering,
  OfferingIntensity,
  OfferingTypes,
  StudentAssessment,
  StudentRestriction,
  User,
  StudentScholasticStandingChangeType,
  StudentAppeal,
} from "@sims/sims-db";
import {
  ScholasticStanding,
  ScholasticStandingSummary,
  ScholasticStandingSummaryDetails,
} from "./student-scholastic-standings.models";
import { StudentRestrictionService } from "../restriction/student-restriction.service";
import {
  PART_TIME_SCHOLASTIC_STANDING_RESTRICTIONS,
  SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS,
} from "../../utilities";
import {
  NotificationActionsService,
  RestrictionCode,
  StudentRestrictionSharedService,
} from "@sims/services";
import { EducationProgramOfferingService } from "../education-program-offering/education-program-offering.service";

/**
 * Scholastic standing restrictions that are applied to the student
 * when a scholastic standing is submitted and the student already had
 * previous scholastic standing restrictions applied.
 */
const SCHOLASTIC_ESCALATION_RESTRICTIONS = [
  RestrictionCode.SSR,
  RestrictionCode.SSRN,
];
/**
 * Full-time scholastic standing change types that will
 * apply restrictions to the student.
 */
const SCHOLASTIC_RESTRICTION_TYPES_FULL_TIME = [
  StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
  StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
];

/**
 * Manages the student scholastic standings related operations.
 */
@Injectable()
export class StudentScholasticStandingsService extends RecordDataModelService<StudentScholasticStanding> {
  private readonly offeringRepo: Repository<EducationProgramOffering>;

  constructor(
    private readonly dataSource: DataSource,
    private readonly studentRestrictionService: StudentRestrictionService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly studentRestrictionSharedService: StudentRestrictionSharedService,
  ) {
    super(dataSource.getRepository(StudentScholasticStanding));
    this.offeringRepo = dataSource.getRepository(EducationProgramOffering);
  }

  /**
   * Save scholastic standing and create new assessment
   * for an application.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param application application object.
   * @param scholasticStandingData scholastic standing data to be saved.
   * @returns Student scholastic standing.
   */
  async saveScholasticStandingCreateReassessment(
    auditUserId: number,
    application: Application,
    scholasticStandingData: ScholasticStanding,
  ): Promise<StudentScholasticStanding> {
    return this.dataSource.transaction(async (transactionalEntityManager) => {
      const now = new Date();
      const auditUser = { id: auditUserId } as User;

      // Get existing offering.
      const existingOffering = await this.offeringRepo
        .createQueryBuilder("offering")
        .select([
          "offering",
          "educationProgram.id",
          "institutionLocation.id",
          "parentOffering.id",
        ])
        .where("offering.id = :offeringId", {
          offeringId: application.currentAssessment.offering.id,
        })
        .innerJoin("offering.educationProgram", "educationProgram")
        .innerJoin("offering.institutionLocation", "institutionLocation")
        .innerJoin("offering.parentOffering", "parentOffering")
        .getOne();

      // Check for restrictions and apply if any.
      const studentRestrictions = await this.getScholasticStandingRestrictions(
        scholasticStandingData,
        existingOffering.offeringIntensity,
        application.student.id,
        auditUserId,
        application.id,
      );
      let createdRestrictions: StudentRestriction[];
      if (studentRestrictions.length) {
        // Used later to send the notification at the end of the process.
        createdRestrictions = await transactionalEntityManager
          .getRepository(StudentRestriction)
          .save(studentRestrictions);
      }

      // Create StudentScholasticStanding.
      const scholasticStanding = new StudentScholasticStanding();
      scholasticStanding.changeType =
        scholasticStandingData.scholasticStandingChangeType;
      scholasticStanding.application = { id: application.id } as Application;
      scholasticStanding.submittedData = scholasticStandingData;
      scholasticStanding.submittedDate = now;
      scholasticStanding.submittedBy = auditUser;
      scholasticStanding.creator = auditUser;
      scholasticStanding.createdAt = now;

      // Reference offering id.
      scholasticStanding.referenceOffering = existingOffering;

      if (
        scholasticStandingData.scholasticStandingChangeType !==
        StudentScholasticStandingChangeType.StudentDidNotCompleteProgram
      ) {
        // If not unsuccessful weeks, then clone new offering and create re-assessment.
        const offering: EducationProgramOffering = { ...existingOffering };

        // Assigning id and audit fields as undefined, so that when its saved its considered as a new EducationProgramOffering object.
        offering.id = undefined;
        offering.modifier = undefined;
        offering.updatedAt = undefined;
        offering.creator = auditUser;
        offering.createdAt = now;

        const newStudyEndDate =
          scholasticStandingData.dateOfChange ??
          scholasticStandingData.dateOfCompletion ??
          scholasticStandingData.dateOfWithdrawal;

        offering.studyEndDate = newStudyEndDate;

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
        if (offering.studyBreaks?.studyBreaks) {
          // Study Breaks calculation.
          const adjustedStudyBreak =
            EducationProgramOfferingService.adjustStudyBreaks(
              offering.studyBreaks.studyBreaks,
              offering.studyEndDate,
            );
          // Assigning newly adjusted study breaks to the offering.
          offering.studyBreaks = {
            ...offering.studyBreaks,
            studyBreaks: adjustedStudyBreak,
          };
        }
        const calculatedBreaks =
          EducationProgramOfferingService.getCalculatedStudyBreaksAndWeeks({
            studyEndDate: offering.studyEndDate,
            studyStartDate: offering.studyStartDate,
            studyBreaks: offering.studyBreaks.studyBreaks,
          });
        offering.studyBreaks =
          EducationProgramOfferingService.assignStudyBreaks(calculatedBreaks);
        // Save new offering.
        const savedOffering = await transactionalEntityManager
          .getRepository(EducationProgramOffering)
          .save(offering);

        // Create the new assessment to be processed.
        scholasticStanding.studentAssessment = {
          application: { id: application.id } as Application,
          triggerType: AssessmentTriggerType.ScholasticStandingChange,
          creator: auditUser,
          createdAt: now,
          submittedBy: auditUser,
          submittedDate: now,
          offering: { id: savedOffering.id } as EducationProgramOffering,
        } as StudentAssessment;
        // Update the student appeal record for the student assessment if it exists.
        if (application.currentAssessment.studentAppeal) {
          scholasticStanding.studentAssessment.studentAppeal = {
            id: application.currentAssessment.studentAppeal.id,
          } as StudentAppeal;
        }
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

      // Set archive to true.
      application.isArchived = true;

      // Save current application.
      await transactionalEntityManager
        .getRepository(Application)
        .save(application);

      // Case a restriction was created, send a notification to the student.
      // Left as the last step to ensure that everything else was processed with
      // success and the notification will not be generated otherwise.
      if (createdRestrictions?.length) {
        const restrictionIds = createdRestrictions.map(
          (createdRestriction) => createdRestriction.id,
        );
        await this.studentRestrictionSharedService.createNotifications(
          restrictionIds,
          auditUserId,
          transactionalEntityManager,
        );
      }

      // Create a student notification when institution reports a change.
      await this.notificationActionsService.saveInstitutionReportChangeNotification(
        {
          givenNames: application.student.user.firstName,
          lastName: application.student.user.lastName,
          toAddress: application.student.user.email,
          userId: application.student.user.id,
        },
        auditUserId,
        transactionalEntityManager,
      );

      return studentScholasticStanding;
    });
  }

  /**
   * Process the payload data and checks for certain restriction,
   * and add new restrictions, if required.
   * @param scholasticStandingData scholastic standing data.
   * @param offeringIntensity offering intensity.
   * @param studentId student id.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param applicationId application id.
   * @returns a new student restriction object(s), that need to be saved.
   */
  async getScholasticStandingRestrictions(
    scholasticStandingData: ScholasticStanding,
    offeringIntensity: OfferingIntensity,
    studentId: number,
    auditUserId: number,
    applicationId: number,
  ): Promise<StudentRestriction[]> {
    if (offeringIntensity === OfferingIntensity.fullTime) {
      return this.getFullTimeStudentRestrictions(
        scholasticStandingData,
        studentId,
        auditUserId,
        applicationId,
      );
    }
    if (offeringIntensity === OfferingIntensity.partTime) {
      return this.getPartTimeStudentRestrictions(
        scholasticStandingData,
        studentId,
        auditUserId,
        applicationId,
      );
    }
  }

  /**
   * Get full-time related restrictions for scholastic standing.
   * Evaluates the scholastic standing change type and
   * creates the appropriate restrictions based on the type.
   * If the scholastic standing change type is not related to withdrawal
   * or unsuccessful completion, then no restrictions are created.
   * Once SSR or SSRN are present in the student account, any of the
   * above mentioned restrictions will create a new SSRN restriction
   * (if one is not present or active yet).
   * 'Student withdrew from program' will always create a new WTHD restriction
   * if one is not present or active yet.
   * @param scholasticStandingData scholastic standing data.
   * @param studentId student id.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param applicationId application id.
   * @returns new student restriction(s), that need to be saved.
   */
  private async getFullTimeStudentRestrictions(
    scholasticStandingData: ScholasticStanding,
    studentId: number,
    auditUserId: number,
    applicationId: number,
  ): Promise<StudentRestriction[]> {
    const restrictions: StudentRestriction[] = [];
    if (
      !SCHOLASTIC_RESTRICTION_TYPES_FULL_TIME.includes(
        scholasticStandingData.scholasticStandingChangeType,
      )
    ) {
      // If the scholastic standing change type is not related to withdrawal
      // or unsuccessful completion then no restrictions are required.
      return restrictions;
    }
    // Get all existing restrictions for the student that potentially will be required
    // to determine the new restriction(s) to be created.
    const existingRestrictions =
      await this.studentRestrictionService.getRestrictionByCodes(studentId, [
        RestrictionCode.SSR,
        RestrictionCode.SSRN,
        RestrictionCode.WTHD,
      ]);
    const hasEscalationRestrictions = existingRestrictions.some(
      (studentRestriction) =>
        SCHOLASTIC_ESCALATION_RESTRICTIONS.includes(
          studentRestriction.restriction.restrictionCode as RestrictionCode,
        ),
    );
    // Check for SSR and SSRN pre-existing restrictions.
    if (hasEscalationRestrictions) {
      // A SSRN needs to be created if an active one does not exist.
      const hasActiveSSRN = existingRestrictions.some(
        (studentRestriction) =>
          studentRestriction.restriction.restrictionCode ===
            RestrictionCode.SSRN && studentRestriction.isActive,
      );
      if (!hasActiveSSRN) {
        const ssrnRestriction =
          await this.studentRestrictionSharedService.createRestrictionToSave(
            studentId,
            RestrictionCode.SSRN,
            auditUserId,
            applicationId,
          );
        restrictions.push(ssrnRestriction);
      }
    } else if (
      scholasticStandingData.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentDidNotCompleteProgram
    ) {
      // Only check for SSR if SSR or SSRN are not present.
      if (!scholasticStandingData.numberOfUnsuccessfulWeeks) {
        throw new Error("Number of unsuccessful weeks is empty.");
      }
      const totalExistingUnsuccessfulWeeks =
        await this.getTotalFullTimeUnsuccessfulWeeks(studentId);
      // When total number of unsuccessful weeks hits minimum 68, add SSR restriction.
      if (
        totalExistingUnsuccessfulWeeks +
          scholasticStandingData.numberOfUnsuccessfulWeeks >=
        SCHOLASTIC_STANDING_MINIMUM_UNSUCCESSFUL_WEEKS
      ) {
        const ssrRestriction =
          await this.studentRestrictionSharedService.createRestrictionToSave(
            studentId,
            RestrictionCode.SSR,
            auditUserId,
            applicationId,
          );
        restrictions.push(ssrRestriction);
        return restrictions;
      }
    }
    if (
      scholasticStandingData.scholasticStandingChangeType ===
      StudentScholasticStandingChangeType.StudentWithdrewFromProgram
    ) {
      // Check for "WTHD" restriction since it should always be created if one is not present and active.
      const hasActiveWTHD = existingRestrictions.some(
        (studentRestriction) =>
          studentRestriction.restriction.restrictionCode ===
            RestrictionCode.WTHD && studentRestriction.isActive,
      );
      // Check if "WTHD" restriction is already present for the student,
      // if not, then create a new one.
      if (!hasActiveWTHD) {
        const wthdRestriction =
          await this.studentRestrictionSharedService.createRestrictionToSave(
            studentId,
            RestrictionCode.WTHD,
            auditUserId,
            applicationId,
          );
        restrictions.push(wthdRestriction);
      }
      // Check if an SSR or SSRN was created for the student.
      const createdSSROrSSRN = restrictions.some((studentRestriction) =>
        SCHOLASTIC_ESCALATION_RESTRICTIONS.includes(
          studentRestriction.restriction.restrictionCode as RestrictionCode,
        ),
      );
      if (hasActiveWTHD && !createdSSROrSSRN) {
        // If the student does not have SSR or SSRN restriction created yet and there was
        // already an active WTHD, then create a new SSR restriction.
        const ssrRestriction =
          await this.studentRestrictionSharedService.createRestrictionToSave(
            studentId,
            RestrictionCode.SSR,
            auditUserId,
            applicationId,
          );
        restrictions.push(ssrRestriction);
      }
    }
    return restrictions;
  }

  /**
   * Get part time related restrictions for scholastic standing.
   * When institution report Withdrawal OR unsuccessful for a PT course application,
   * add PTSSR restriction to student.
   * If a ministry user resolves the PTSSR restriction, and new withdrawal/unsuccessful
   * is reported, re add the above restrictions.
   * * If an active PTSSR restriction exists already for the student and the student withdrawal
   * * again or or unsuccessful weeks is reported again, then add another PTSSR restriction.
   * @param scholasticStandingData scholastic standing data.
   * @param studentId student id.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @param applicationId application id.
   * @returns a new student restriction objects, that need to be saved.
   */
  private async getPartTimeStudentRestrictions(
    scholasticStandingData: ScholasticStanding,
    studentId: number,
    auditUserId: number,
    applicationId: number,
  ): Promise<StudentRestriction[]> {
    const studentRestriction: StudentRestriction[] = [];
    if (
      [
        StudentScholasticStandingChangeType.StudentDidNotCompleteProgram,
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram,
      ].includes(scholasticStandingData.scholasticStandingChangeType)
    ) {
      // Create an array to hold the restriction promises.
      const restrictionPromises =
        PART_TIME_SCHOLASTIC_STANDING_RESTRICTIONS.map((restrictionCode) =>
          this.studentRestrictionSharedService.createRestrictionToSave(
            studentId,
            restrictionCode,
            auditUserId,
            applicationId,
          ),
        );
      const restrictions = await Promise.all(restrictionPromises);
      studentRestriction.push(...restrictions);
    }
    return studentRestriction;
  }

  /**
   * Get the sum of unsuccessfulWeeks for all existing scholastic standing for the
   * requested student.
   * @param studentId student id.
   * @returns sum of unsuccessfulWeeks for all existing scholastic standing for the
   * requested student.
   */
  async getTotalFullTimeUnsuccessfulWeeks(studentId: number): Promise<number> {
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
    return +(query?.sum ?? 0);
  }

  /**
   * Get unsuccessful scholastic standing of a student application.
   * @param applicationId application id.
   * @param studentId student id.
   * @return student scholastic standing.
   */
  async getUnsuccessfulScholasticStandings(
    applicationId: number,
    studentId?: number,
  ): Promise<StudentScholasticStanding> {
    const unsuccessfulScholasticStandings = this.repo
      .createQueryBuilder("studentScholasticStanding")
      .select([
        "studentScholasticStanding.id",
        "studentScholasticStanding.createdAt",
      ])
      .innerJoin("studentScholasticStanding.application", "application")
      .where("application.id = :applicationId", { applicationId })
      .andWhere("studentScholasticStanding.unsuccessfulWeeks IS NOT NULL");

    if (studentId) {
      unsuccessfulScholasticStandings
        .innerJoin("application.student", "student")
        .andWhere("student.id = :studentId", { studentId });
    }

    return unsuccessfulScholasticStandings.getOne();
  }

  /**
   * Get scholastic standing submitted details.
   * @param scholasticStandingId scholastic standing id.
   * @param options options for the scholastic standing details.
   * - `studentId` student id to retrieve the scholastic standing details.
   * - `locationIds` location ids to filter the scholastic standing.
   * @return student scholastic standing.
   */
  async getScholasticStanding(
    scholasticStandingId: number,
    options?: {
      studentId?: number;
      locationIds?: number[];
    },
  ): Promise<StudentScholasticStanding> {
    const studentScholasticStanding = this.repo
      .createQueryBuilder("studentScholasticStanding")
      .select([
        "studentScholasticStanding.id",
        "studentScholasticStanding.submittedData",
        "application.applicationStatus",
        "application.applicationNumber",
        "offering.offeringIntensity",
        "offering.studyStartDate",
        "offering.studyEndDate",
        "institutionLocation.name",
        "student.id",
        "application.id",
        "user.firstName",
        "user.lastName",
        "offering.name",
        "educationProgram.description",
        "educationProgram.name",
        "educationProgram.credentialType",
        "educationProgram.deliveredOnline",
        "educationProgram.deliveredOnSite",
        "offering.offeringDelivered",
        "offering.studyBreaks",
        "offering.actualTuitionCosts",
        "offering.programRelatedCosts",
        "offering.mandatoryFees",
        "offering.exceptionalExpenses",
      ])
      .innerJoin("studentScholasticStanding.referenceOffering", "offering")
      .innerJoin("offering.institutionLocation", "institutionLocation")
      .innerJoin("offering.educationProgram", "educationProgram")
      .innerJoin("studentScholasticStanding.application", "application")
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .where("studentScholasticStanding.id = :scholasticStandingId", {
        scholasticStandingId,
      });
    if (options?.studentId) {
      studentScholasticStanding.andWhere("student.id = :studentId", {
        studentId: options.studentId,
      });
    }
    if (options?.locationIds && options?.locationIds.length > 0) {
      studentScholasticStanding.andWhere(
        "institutionLocation.id IN (:...locationIds)",
        {
          locationIds: options.locationIds,
        },
      );
    }
    return studentScholasticStanding.getOne();
  }

  /**
   * Get scholastic standing unsuccessful completion weeks summary details.
   * @param studentId student id to retrieve the scholastic standing summary details.
   * @return student scholastic standing unsuccessful completion weeks summary details.
   */
  async getScholasticStandingSummary(
    studentId: number,
  ): Promise<ScholasticStandingSummaryDetails> {
    const scholasticStandingSummary = await this.repo
      .createQueryBuilder("studentScholasticStanding")
      .select(
        "SUM(studentScholasticStanding.unsuccessfulWeeks)::int",
        "totalUnsuccessfulWeeks",
      )
      .addSelect("application.offeringIntensity", "offeringIntensity")
      .innerJoin("studentScholasticStanding.application", "application")
      .innerJoin("application.student", "student")
      .where("student.id = :studentId", {
        studentId,
      })
      .groupBy("application.offeringIntensity")
      .getRawMany<ScholasticStandingSummary>();

    const scholasticStandingSummaryPartTime = scholasticStandingSummary.find(
      (summary) => summary.offeringIntensity === OfferingIntensity.partTime,
    );
    const scholasticStandingSummaryFullTime = scholasticStandingSummary.find(
      (summary) => summary.offeringIntensity === OfferingIntensity.fullTime,
    );
    return {
      partTimeUnsuccessfulCompletionWeeks:
        scholasticStandingSummaryPartTime?.totalUnsuccessfulWeeks ?? 0,
      fullTimeUnsuccessfulCompletionWeeks:
        scholasticStandingSummaryFullTime?.totalUnsuccessfulWeeks ?? 0,
    };
  }
}
