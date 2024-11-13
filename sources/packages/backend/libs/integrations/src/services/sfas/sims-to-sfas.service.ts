import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  ApplicationRecord,
  RestrictionRecord,
  StudentDetail,
} from "./sims-to-sfas.model";
import {
  Application,
  ApplicationStatus,
  RestrictionType,
  SFASBridgeLog,
  Student,
  StudentRestriction,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { Brackets, Repository } from "typeorm";
import {
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
  BC_STUDENT_LOAN_AWARD_CODE,
} from "@sims/services/constants";

/**
 * SIMS to SFAS services.
 */
@Injectable()
export class SIMSToSFASService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(StudentRestriction)
    private readonly restrictionRepo: Repository<StudentRestriction>,
    @InjectRepository(SFASBridgeLog)
    private readonly sfasBridgeLogRepo: Repository<SFASBridgeLog>,
  ) {}

  /**
   * Get the latest bridge file log date.
   * When there is no log, null will be returned.
   * @returns latest bridge file log date.
   */
  async getLatestBridgeFileLogDate(): Promise<Date | null> {
    const [latestBridgeFileLog] = await this.sfasBridgeLogRepo.find({
      select: { id: true, referenceDate: true },
      order: { referenceDate: "DESC" },
      take: 1,
    });
    return latestBridgeFileLog ? latestBridgeFileLog.referenceDate : null;
  }

  /**
   * Log the details of bridge file that was sent to SFAS.
   * @param referenceDate date when the bridge file data was extracted.
   * @param fileName bridge file name.
   */
  async logBridgeFileDetails(
    referenceDate: Date,
    fileName: string,
  ): Promise<void> {
    await this.sfasBridgeLogRepo.insert({
      referenceDate,
      generatedFileName: fileName,
    });
  }

  /**
   * Get all student ids of students who have one or more updates
   * between the given period.
   * The updates can be one or more of the following:
   * - Student or User data
   * - SIN validation data
   * - CAS supplier data
   * - Overawards data
   * @param modifiedSince the date after which the student data was updated.
   * @param modifiedUntil the date until which the student data was updated.
   */
  async getAllStudentsWithUpdates(
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<number[]> {
    const studentIdAlias = "studentId";
    const applicationsWithStudentUpdates = await this.applicationRepo
      .createQueryBuilder("application")
      .select("student.id", studentIdAlias)
      .distinctOn([`"${studentIdAlias}"`])
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.casSupplier", "casSupplier")
      .leftJoin("student.overawards", "overaward")
      .where("application.applicationStatus != :overwritten")
      .andWhere("application.currentAssessment is not null")
      // Check if the student data was updated in the given period.
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "student.updatedAt > :modifiedSince AND student.updatedAt <= :modifiedUntil",
          )
            .orWhere(
              "user.updatedAt > :modifiedSince AND user.updatedAt <= :modifiedUntil",
            )
            .orWhere(
              "sinValidation.updatedAt > :modifiedSince AND sinValidation.updatedAt <= :modifiedUntil",
            )
            .orWhere(
              "casSupplier.updatedAt > :modifiedSince AND casSupplier.updatedAt <= :modifiedUntil",
            )
            .orWhere(
              "overaward.updatedAt > :modifiedSince AND overaward.updatedAt <= :modifiedUntil",
            );
        }),
      )
      .setParameters({
        overwritten: ApplicationStatus.Overwritten,
        modifiedSince,
        modifiedUntil,
      })
      .getRawMany<{ [studentIdAlias]: number }>();
    // Extract the student ids from the applications.
    const modifiedStudentIds = applicationsWithStudentUpdates.map(
      (applicationWithStudentUpdate) =>
        applicationWithStudentUpdate[studentIdAlias],
    );

    return modifiedStudentIds;
  }

  /**
   * Get all student ids of students who have one or more updates in application related data.
   * @param modifiedSince the date after which the student data was updated.
   * @param modifiedUntil the date until which the student data was updated.\
   */
  async getAllStudentsWithApplicationUpdates(
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<ApplicationRecord[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select("student.id", "studentId")
        .addSelect("application.id", "applicationId")
        .addSelect("programYear.programYear", "programYear")
        .addSelect("offering.offeringIntensity", "offeringIntensity")
        // Use CASE to conditionally select studyStartDate and studyEndDate and casting JSON values to dates.
        .addSelect(
          `CASE
      WHEN studentAssessment.offering IS NULL THEN (application.data->>'studyStartDate')::date
      ELSE offering.study_start_date
     END`,
          "studyStartDate",
        )
        .addSelect(
          `CASE
      WHEN studentAssessment.offering IS NULL THEN (application.data->>'studyEndDate')::date
      ELSE offering.study_end_date
     END`,
          "studyEndDate",
        )
        // Summing CSGP awards where value_code is 'CSGP'.
        .addSelect(
          `SUM(CASE WHEN disbursementValues.value_code = 'CSGP' THEN disbursementValues.valueAmount ELSE 0 END)`,
          "csgpAwardTotal",
        )
        // Summing SBSD awards where value_code is 'SBSD.
        .addSelect(
          `SUM(CASE WHEN disbursementValues.value_code = 'SBSD' THEN disbursementValues.valueAmount ELSE 0 END)`,
          "sbsdAwardTotal",
        )
        // Application cancel date when status is cancelled.
        .addSelect(
          `CASE
      WHEN application.applicationStatus = :cancelled THEN application.application_status_updated_on
      ELSE NULL
     END`,
          "applicationCancelDate",
        )
        .innerJoin("application.currentAssessment", "studentAssessment")
        .innerJoin("application.programYear", "programYear")
        .innerJoin("application.student", "student")
        .innerJoin("studentAssessment.offering", "offering")
        .innerJoin(
          "studentAssessment.disbursementSchedules",
          "disbursementSchedule",
        )
        .innerJoin(
          "disbursementSchedule.disbursementValues",
          "disbursementValues",
        )
        .where("application.applicationStatus != :overwritten")
        // Check if the application data was updated in the given period.
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "application.updatedAt > :modifiedSince AND application.updatedAt <= :modifiedUntil",
            );
          }),
        )
        .setParameters({
          overwritten: ApplicationStatus.Overwritten,
          cancelled: ApplicationStatus.Cancelled,
          modifiedSince,
          modifiedUntil,
        })
        .groupBy("student.id")
        .addGroupBy("application.id")
        .addGroupBy("programYear.id")
        .addGroupBy("studentAssessment.id")
        .addGroupBy("offering.id")
        .orderBy("offering.offeringIntensity")
        .getRawMany<ApplicationRecord>()
    );
  }

  /**
   * Get all student ids of students who have one or more updates in restriction related data.
   * @param modifiedSince the date after which the student data was updated.
   * @param modifiedUntil the date until which the student data was updated.
   */
  async getAllStudentsWithRestrictionUpdates(
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<RestrictionRecord[]> {
    return (
      this.restrictionRepo
        .createQueryBuilder("studentRestriction")
        .select("studentRestriction.id", "restrictionId")
        .addSelect("student.id", "studentId")
        .addSelect("restriction.restrictionCode", "restrictionCode")
        .addSelect("studentRestriction.createdAt", "restrictionEffectiveDate")
        // Conditionally set restrictionRemovalDate based on isActive status.
        .addSelect(
          `CASE 
      WHEN studentRestriction.is_active = false THEN studentRestriction.updatedAt 
      ELSE NULL 
     END`,
          "restrictionRemovalDate",
        )
        .innerJoin("studentRestriction.student", "student")
        .innerJoin("studentRestriction.restriction", "restriction")
        // Check if the restriction data was updated in the given period.
        .where("restriction.restrictionType = :restrictionType")
        .andWhere(
          new Brackets((qb) => {
            qb.where(
              "studentRestriction.updatedAt > :modifiedSince AND studentRestriction.updatedAt <= :modifiedUntil",
            );
          }),
        )
        .setParameters({
          restrictionType: RestrictionType.Provincial,
          modifiedSince,
          modifiedUntil,
        })
        .getRawMany<RestrictionRecord>()
    );
  }

  /**
   * Get student details of students who have one or more updates.
   * @param studentIds student ids.
   * @returns student details.
   */
  async getStudentRecordsByStudentIds(
    studentIds: number[],
  ): Promise<StudentDetail[]> {
    const queryResult = await this.studentRepo
      .createQueryBuilder("student")
      .select([
        "student.id",
        "student.birthDate",
        "student.disabilityStatus",
        "student.disabilityStatusEffectiveDate",
        "user.firstName",
        "user.lastName",
        "sinValidation.sin",
        "casSupplier.supplierNumber",
        "casSupplier.supplierAddress",
      ])
      .addSelect("SUM(cslfOveraward.overawardValue)", "cslfOverawardTotal")
      .addSelect("SUM(bcslOveraward.overawardValue)", "bcslOverawardTotal")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.casSupplier", "casSupplier")
      .leftJoin(
        "student.overawards",
        "cslfOveraward",
        "cslfOveraward.disbursementValueCode = :cslfAwardCode",
      )
      .leftJoin(
        "student.overawards",
        "bcslOveraward",
        "bcslOveraward.disbursementValueCode = :bcslAwardCode",
      )
      .groupBy("student.id")
      .addGroupBy("user.id")
      .addGroupBy("sinValidation.id")
      .addGroupBy("casSupplier.id")
      .where("student.id IN (:...studentIds)")
      .setParameters({
        cslfAwardCode: CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
        bcslAwardCode: BC_STUDENT_LOAN_AWARD_CODE,
        studentIds,
      })
      .getRawAndEntities();

    return mapFromRawAndEntities<StudentDetail>(
      queryResult,
      "cslfOverawardTotal",
      "bcslOverawardTotal",
    );
  }
}
