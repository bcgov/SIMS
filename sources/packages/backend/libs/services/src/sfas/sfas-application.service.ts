import { Injectable } from "@nestjs/common";
import { DataSource, Brackets, MoreThanOrEqual } from "typeorm";
import { DataModelService, SFASApplication } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASApplicationService extends DataModelService<SFASApplication> {
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASApplication));
  }

  /**
   * Validates before an application submission to see if there is an overlapping SFAS fulltime application existing.
   * @param sin
   * @param birthDate
   * @param lastName
   * @param studyStartDate
   * @param studyEndDate
   * @returns SFAS fulltime application.
   */
  async validateDateOverlap(
    sin: string,
    birthDate: string,
    lastName: string,
    studyStartDate: string,
    studyEndDate: string,
  ): Promise<SFASApplication> {
    return this.repo
      .createQueryBuilder("sfasApplication")
      .select(["sfasApplication.id"])
      .innerJoin("sfasApplication.individual", "sfasFTstudent")
      .where("lower(sfasFTstudent.lastName) = lower(:lastName)", { lastName })
      .andWhere("sfasFTstudent.sin = :sin", { sin })
      .andWhere("sfasFTstudent.birthDate = :birthDate", { birthDate })
      .andWhere(
        new Brackets((qb) => {
          qb.where(
            "sfasApplication.startDate BETWEEN :startDateFT AND :endDateFT",
            { startDateFT: studyStartDate, endDateFT: studyEndDate },
          )
            .orWhere(
              "sfasApplication.endDate BETWEEN :startDateFT AND :endDateFT",
              { startDateFT: studyStartDate, endDateFT: studyEndDate },
            )
            .orWhere(
              ":startDateFT BETWEEN sfasApplication.startDate AND sfasApplication.endDate",
              { startDateFT: studyStartDate },
            )
            .orWhere(
              ":endDateFT BETWEEN sfasApplication.startDate AND sfasApplication.endDate",
              { endDateFT: studyEndDate },
            );
        }),
      )
      .getOne();
  }

  /**
   * Total BCSL amount that the student received from the legacy(SFAS) system.
   * @param studentId student id.
   * @returns total BCSL amount that the student received from the legacy(sfas) system.
   */
  async totalLegacyBCSLAmount(studentId: number): Promise<number> {
    const total = await this.repo
      .createQueryBuilder("sfasApplication")
      .select("SUM(sfasApplication.bslAward)")
      .innerJoin("sfasApplication.individual", "sfasFTstudent")
      .where("sfasFTstudent.id = :studentId", { studentId })
      .getRawOne<{ sum?: number }>();
    return +(total?.sum ?? 0);
  }

  async getIndividualApplicationByIndividualId(
    individualId: number,
  ): Promise<SFASApplication[]> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - 730);
    return this.repo.find({
      select: {
        id: true,
        endDate: true,
      },
      where: {
        individualId: individualId,
        endDate: MoreThanOrEqual(twoYearsAgo.toISOString()), // Only select endDate within 730 days.
      },
      order: {
        endDate: "DESC",
      },
      take: 1,
    });
  }

  @InjectLogger()
  logger: LoggerService;
}
