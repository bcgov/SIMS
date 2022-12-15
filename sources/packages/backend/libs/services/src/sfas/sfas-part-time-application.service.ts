import { Injectable } from "@nestjs/common";
import { DataSource, Brackets } from "typeorm";
import { DataModelService, SFASPartTimeApplications } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

/**
 * Manages the part time application data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASPartTimeApplicationsService extends DataModelService<SFASPartTimeApplications> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASPartTimeApplications));
  }

  /**
   * Validates before an application submission to see if there is an overlapping SFAS part-time application existing.
   * @param sin
   * @param birthDate
   * @param lastName
   * @param studyStartDate
   * @param studyEndDate
   * @returns SFAS part-time application.
   */
  async validateDateOverlap(
    sin: string,
    birthDate: string,
    lastName: string,
    studyStartDate: string,
    studyEndDate: string,
  ): Promise<SFASPartTimeApplications> {
    return this.repo
      .createQueryBuilder("sfasPTApplication")
      .select(["sfasPTApplication.id"])
      .innerJoin("sfasPTApplication.individual", "sfasPTstudent")
      .where("lower(sfasPTstudent.lastName) = lower(:lastName)", { lastName })
      .andWhere("sfasPTstudent.sin = :sin", { sin })
      .andWhere("sfasPTstudent.birthDate = :birthDate", { birthDate })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "sfasPTApplication.startDate BETWEEN :startDatePT AND :endDatePT",
            { startDatePT: studyStartDate, endDatePT: studyEndDate },
          )
            .orWhere(
              "sfasPTApplication.endDate BETWEEN :startDatePT AND :endDatePT",
              { startDatePT: studyStartDate, endDatePT: studyEndDate },
            )
            .orWhere(
              ":startDatePT BETWEEN sfasPTApplication.startDate AND sfasPTApplication.endDate",
              { startDatePT: studyStartDate },
            )
            .orWhere(
              ":endDatePT BETWEEN sfasPTApplication.startDate AND sfasPTApplication.endDate",
              { endDatePT: studyEndDate },
            );
        }),
      )
      .getOne();
  }
  @InjectLogger()
  logger: LoggerService;
}
