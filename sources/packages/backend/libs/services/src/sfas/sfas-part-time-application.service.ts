import { Injectable } from "@nestjs/common";
import { DataSource, Brackets, MoreThanOrEqual } from "typeorm";
import { DataModelService, SFASPartTimeApplications } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { SFASSignedMSFAA } from "@sims/services/sfas/sfas-individual.model";
import { MAX_MSFAA_VALID_DAYS } from "@sims/utilities";

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
   * @param sin Student SIN number.
   * @param birthDate Student date of birth.
   * @param lastName Student last name.
   * @param studyStartDate Study period start date.
   * @param studyEndDate Study period end date.
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
  /**
   * Fetch the SFAS part time application for the student and the latest
   * application which has the end date within 730 days
   * @param studentId student id.
   * @returns SFASSignedMSFAA which contains the SFAS Signed MSFAA
   * and latest application end date.
   */
  async getIndividualPartTimeApplicationByIndividualId(
    studentId: number,
  ): Promise<SFASSignedMSFAA | null> {
    const twoYearsAgo = new Date();
    twoYearsAgo.setDate(twoYearsAgo.getDate() - MAX_MSFAA_VALID_DAYS);
    const [sfasApplication] = await this.repo.find({
      select: {
        id: true,
        endDate: true,
        individual: {
          id: true,
          partTimeMSFAANumber: true,
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
        sfasMSFAANumber: sfasApplication.individual.partTimeMSFAANumber,
        latestSFASApplicationEndDate: sfasApplication.endDate,
      } as SFASSignedMSFAA;
    }
    return null;
  }

  @InjectLogger()
  logger: LoggerService;
}
