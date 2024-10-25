import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { StudentDetail } from "./sims-to-sfas.model";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
} from "@sims/services/constants";
import {
  Application,
  ApplicationStatus,
  mapFromRawAndEntities,
  SFASBridgeLog,
  Student,
} from "@sims/sims-db";
import { Brackets, Repository } from "typeorm";

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
   * since the date provided.
   * The updates can be one or more of the following:
   * - Student or User data
   * - Sin validation data
   * - Cas supplier data
   * - Overawards data
   * @param modifiedSince the date after which the student data was updated.
   */
  async getAllStudentsWithUpdates(modifiedSince: Date): Promise<number[]> {
    const applicationStudentQuery = this.applicationRepo
      .createQueryBuilder("application")
      .select(["application.id", "student.id"])
      .distinctOn(["student.id"])
      .innerJoin("application.student", "student")
      .innerJoin("student.user", "user")
      .innerJoin("student.sinValidation", "sinValidation")
      .innerJoin("student.casSupplier", "casSupplier")
      .leftJoin("student.overawards", "overaward")
      .where("application.applicationStatus != :overwritten", {
        overwritten: ApplicationStatus.Overwritten,
      })
      .andWhere("application.currentAssessment is not null");
    applicationStudentQuery
      .andWhere(
        new Brackets((qb) => {
          qb.where("student.updatedAt > :modifiedSince")
            .orWhere("user.updatedAt > :modifiedSince")
            .orWhere("sinValidation.updatedAt > :modifiedSince")
            .orWhere("casSupplier.updatedAt > :modifiedSince")
            .orWhere("overaward.updatedAt > :modifiedSince");
        }),
      )
      .setParameter("modifiedSince", modifiedSince);

    const applicationsWithStudentUpdates =
      await applicationStudentQuery.getMany();
    // Extract the student ids from the applications.
    const modifiedStudentIds = applicationsWithStudentUpdates.map(
      (application) => application.student.id,
    );

    return modifiedStudentIds;
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
  // TODO: SIMS to SFAS - Add methods to extract application and restriction data.
}
