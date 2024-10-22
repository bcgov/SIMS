import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  ApplicationStatus,
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
   * @returns latest bridge file log.
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
   * Get all student ids of students who have one or more updates
   * since the date provided.
   * The updates can be one or more of the following:
   * - Student or User data
   * - Sin validation data
   * - Cas supplier data
   * - Overawards data
   * @param modifiedSince the date after which the student data was updated.
   * If not provided, all the students with at least one submitted application will be returned.
   */
  async getAllStudentsWithUpdates(modifiedSince?: Date): Promise<number[]> {
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
    if (modifiedSince) {
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
    }
    const applicationsWithStudentUpdates =
      await applicationStudentQuery.getMany();
    // Extract the student ids from the applications.
    const modifiedStudentIds = applicationsWithStudentUpdates.map(
      (application) => application.student.id,
    );
    return modifiedStudentIds;
  }
}
