import { Injectable } from "@nestjs/common";
import { DataSource, Brackets } from "typeorm";
import { DataModelService, SFASApplication } from "@sims/sims-db";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { getUTC, getISODateOnlyString } from "../../utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASApplicationRecord } from "../../sfas-integration/sfas-files/sfas-application-record";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASApplicationService
  extends DataModelService<SFASApplication>
  implements SFASDataImporter
{
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASApplication));
  }

  /**
   * Import a record from SFAS. This method will be invoked by SFAS
   * import processing service when the record type is detected as
   * RecordTypeCodes.ApplicationDataRecord.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    // The insert of SFAS application always comes from an external source through integration.
    // Hence all the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    const sfasApplication = new SFASApplicationRecord(record.line);
    const application = new SFASApplication();
    application.id = sfasApplication.applicationId;
    application.individualId = sfasApplication.individualId;
    application.startDate = getISODateOnlyString(sfasApplication.startDate);
    application.endDate = getISODateOnlyString(sfasApplication.endDate);
    application.programYearId = sfasApplication.programYearId;
    application.bslAward = sfasApplication.bslAward;
    application.cslAward = sfasApplication.cslAward;
    application.bcagAward = sfasApplication.bcagAward;
    application.bgpdAward = sfasApplication.bgpdAward;
    application.csfgAward = sfasApplication.csfgAward;
    application.csgtAward = sfasApplication.csgtAward;
    application.csgdAward = sfasApplication.csgdAward;
    application.csgpAward = sfasApplication.csgpAward;
    application.sbsdAward = sfasApplication.sbsdAward;
    application.applicationCancelDate = getISODateOnlyString(
      sfasApplication.applicationCancelDate,
    );
    application.extractedAt = getUTC(extractedDate);
    await this.repo.save(application, { reload: false, transaction: false });
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

  @InjectLogger()
  logger: LoggerService;
}
