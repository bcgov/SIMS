import { Injectable } from "@nestjs/common";
import { DataSource, Brackets, MoreThanOrEqual } from "typeorm";
import { DataModelService, SFASApplication } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { MAX_MSFAA_VALID_DAYS } from "@sims/utilities";
import { SFASSignedMSFAA } from "@sims/services/sfas/sfas-individual.model";

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

  /**
   * Fetch the SFAS full time application for the student and the latest
   * application which has the end date within 730 days.
   * @param studentId student id.
   * @returns SFASSignedMSFAA which contains the SFAS Signed MSFAA
   * and latest application end date.
   */
  async getIndividualFullTimeApplicationByIndividualId(
    studentId: number,
  ): Promise<SFASSignedMSFAA> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - MAX_MSFAA_VALID_DAYS);
    const [sfasApplication] = await this.repo.find({
      select: {
        id: true,
        endDate: true,
        individual: {
          id: true,
          msfaaNumber: true,
        },
      },
      relations: {
        individual: true,
      },
      where: {
        individual: { id: studentId },
        endDate: MoreThanOrEqual(twoYearsAgo.toISOString()), // Only select endDate within 730 days.
      },
      order: {
        endDate: "DESC",
      },
      take: 1,
    });
    if (sfasApplication) {
      return {
        sfasMSFAANumber: sfasApplication.individual.msfaaNumber,
        latestSFASApplicationEndDate: sfasApplication.endDate,
      } as SFASSignedMSFAA;
    }
    return null;
  }

  @InjectLogger()
  logger: LoggerService;
}
