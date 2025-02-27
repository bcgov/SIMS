import { Injectable } from "@nestjs/common";
import { DataSource, Brackets, MoreThanOrEqual, IsNull, Not } from "typeorm";
import { DataModelService, SFASPartTimeApplications } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import {
  MAX_MSFAA_VALID_DAYS,
  addDays,
  getISODateOnlyString,
} from "@sims/utilities";
import { SFASSignedMSFAA } from ".";

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
   * @param studentId Student id.
   * @param studyStartDate Study period start date.
   * @param studyEndDate Study period end date.
   * @returns SFAS part-time application.
   */
  async validateDateOverlap(
    studentId: number,
    studyStartDate: string,
    studyEndDate: string,
  ): Promise<SFASPartTimeApplications> {
    return this.repo
      .createQueryBuilder("sfasPTApplication")
      .select(["sfasPTApplication.id"])
      .innerJoin("sfasPTApplication.individual", "sfasIndividual")
      .where("sfasPTApplication.applicationCancelDate IS NULL")
      .andWhere("sfasIndividual.student.id = :studentId", { studentId })
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
   * Fetch the valid MSFAA number from the latest
   * SFAS part time application for the student
   * which has the end date within 730 days.
   * @param studentId student id.
   * @returns SFASSignedMSFAA which contains the SFAS Signed MSFAA
   * and latest application end date.
   */
  async getValidMSFAAPartTimeApplication(
    studentId: number,
  ): Promise<SFASSignedMSFAA | null> {
    const minMSFAAValidDate = addDays(-MAX_MSFAA_VALID_DAYS);
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
        applicationCancelDate: IsNull(),
        individual: { student: { id: studentId }, msfaaNumber: Not(IsNull()) },
        endDate: MoreThanOrEqual(getISODateOnlyString(minMSFAAValidDate)),
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
