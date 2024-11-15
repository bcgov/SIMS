import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ApplicationRecord, StudentDetail } from "./sims-to-sfas.model";
import {
  Application,
  ApplicationStatus,
  RestrictionType,
  SFASBridgeLog,
  Student,
  StudentRestriction,
  mapFromRawAndEntities,
} from "@sims/sims-db";
import { And, Brackets, LessThanOrEqual, MoreThan, Repository } from "typeorm";
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
    private readonly studentRestrictionRepo: Repository<StudentRestriction>,
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
   * @returns student ids of students who have one or more updates.
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
   * Get all student ids and application data of students who have one or more updates in application related data.
   * @param modifiedSince the date after which the application data was updated.
   * @param modifiedUntil the date until which the application data was updated.
   * @returns student ids and application data of students who have one or more updates in application related data.
   */
  async getAllApplicationsWithUpdates(
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<ApplicationRecord[]> {
    return (
      this.applicationRepo
        .createQueryBuilder("application")
        .select("application.id", "applicationId")
        .addSelect("student.id", "studentId")
        .addSelect("programYear.programYear", "programYear")
        .addSelect(
          "COALESCE(offering.offeringIntensity, (application.data->>'howWillYouBeAttendingTheProgram')::sims.offering_intensity)",
          "offeringIntensity",
        )
        // Use CASE to conditionally select studyStartDate and studyEndDate and casting JSON values to dates.
        .addSelect(
          "COALESCE(offering.studyStartDate, (application.data->>'studystartDate')::date)",
          "studyStartDate",
        )
        .addSelect(
          "COALESCE(offering.studyEndDate, (application.data->>'studyendDate')::date)",
          "studyEndDate",
        )
        // Summing CSGP awards where value_code is 'CSGP'.
        .addSelect(
          "SUM(CASE WHEN disbursementValues.valueCode = 'CSGP' THEN disbursementValues.valueAmount ELSE 0 END)",
          "csgpAwardTotal",
        )
        // Summing SBSD awards where value_code is 'SBSD.
        .addSelect(
          "SUM(CASE WHEN disbursementValues.valueCode = 'SBSD' THEN disbursementValues.valueAmount ELSE 0 END)",
          "sbsdAwardTotal",
        )
        // Application cancel date when status is cancelled.
        .addSelect(
          "CASE WHEN application.applicationStatus = :cancelled THEN application.applicationStatusUpdatedOn ELSE NULL END",
          "applicationCancelDate",
        )
        .innerJoin("application.currentAssessment", "studentAssessment")
        .innerJoin("application.programYear", "programYear")
        .innerJoin("application.student", "student")
        .leftJoin("studentAssessment.offering", "offering")
        .leftJoin(
          "studentAssessment.disbursementSchedules",
          "disbursementSchedule",
        )
        .leftJoin(
          "disbursementSchedule.disbursementValues",
          "disbursementValues",
        )
        .where("application.applicationStatus != :overwritten")
        .andWhere(
          new Brackets((qb) => {
            // Check if the application data was updated in the given period.
            qb.where(
              "application.updatedAt > :modifiedSince AND application.updatedAt <= :modifiedUntil",
            )
              // Check if the assessment data was updated in the given period.
              .orWhere(
                "studentAssessment.updatedAt > :modifiedSince AND studentAssessment.updatedAt <= :modifiedUntil",
              );
          }),
        )

        .setParameters({
          overwritten: ApplicationStatus.Overwritten,
          cancelled: ApplicationStatus.Cancelled,
          modifiedSince,
          modifiedUntil,
        })
        .groupBy("application.id")
        .addGroupBy("programYear.id")
        .addGroupBy("student.id")
        .addGroupBy("offering.id")
        .orderBy("offering.offeringIntensity")
        .getRawMany<ApplicationRecord>()
    );
  }

  /**
   * Get all student ids and restriction data of students who have one or more updates in restriction related data.
   * @param modifiedSince the date after which the restriction data was updated.
   * @param modifiedUntil the date until which the restriction data was updated.
   * @returns student ids and restriction data of students who have one or more updates in restriction related data.
   */
  async getAllRestrictionWithUpdates(
    modifiedSince: Date,
    modifiedUntil: Date,
  ): Promise<StudentRestriction[]> {
    return this.studentRestrictionRepo.find({
      select: {
        id: true,
        student: { id: true },
        restriction: { id: true, restrictionCode: true },
        createdAt: true,
        updatedAt: true,
        isActive: true,
      },
      relations: {
        student: true,
        restriction: true,
      },
      where: {
        restriction: {
          restrictionType: RestrictionType.Provincial,
        },
        updatedAt: And(MoreThan(modifiedSince), LessThanOrEqual(modifiedUntil)),
      },
    });
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
