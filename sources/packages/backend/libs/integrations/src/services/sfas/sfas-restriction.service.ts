import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { DataModelService, Restriction, SFASRestriction } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { getUTC, getISODateOnlyString, getSQLFileData } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASRestrictionRecord } from "../../sfas-integration/sfas-files/sfas-restriction-record";
import { SystemUsersService } from "@sims/services";
import { InjectRepository } from "@nestjs/typeorm";

const SFAS_RESTRICTIONS_RAW_SQL_FOLDER = "sfas-restrictions";

/**
 * Manages the data related to student’s Provincial Restrictions in SFAS.
 * No Federal restrictions is present because SIMS will
 * process the Federal Restriction file on a regular basis.
 */
@Injectable()
export class SFASRestrictionService
  extends DataModelService<SFASRestriction>
  implements SFASDataImporter
{
  private readonly bulkInsertStudentRestrictionsSQL: string;
  constructor(
    dataSource: DataSource,
    private readonly systemUsersService: SystemUsersService,
    @InjectRepository(Restriction)
    private readonly restrictionRepo: Repository<Restriction>,
  ) {
    super(dataSource.getRepository(SFASRestriction));
    this.bulkInsertStudentRestrictionsSQL = getSQLFileData(
      "Bulk-insert-restrictions.sql",
      SFAS_RESTRICTIONS_RAW_SQL_FOLDER,
    );
  }

  /**
   * Bulk operation to insert student restrictions from SFAS restrictions data.
   */
  async insertStudentRestrictions(): Promise<void> {
    try {
      const creator = this.systemUsersService.systemUser;
      const legacyRestriction = await this.restrictionRepo.findOne({
        select: { id: true },
        where: { restrictionCode: "LGCY" },
      });
      await this.repo.manager.query(this.bulkInsertStudentRestrictionsSQL, [
        legacyRestriction.id,
        creator.id,
      ]);
    } catch (error) {
      throw new Error(
        "Error while inserting student restrictions imported from SFAS.",
        {
          cause: error,
        },
      );
    }
  }

  /**
   * Import a record from SFAS. This method will be invoked by SFAS
   * import processing service when the record type is detected as
   * RecordTypeCodes.RestrictionDataRecord.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    // The insert of SFAS record always comes from an external source through integration.
    // Hence all the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    const sfasRestriction = new SFASRestrictionRecord(record.line);
    const restriction = new SFASRestriction();
    restriction.id = sfasRestriction.restrictionId;
    restriction.individualId = sfasRestriction.individualId;
    restriction.code = sfasRestriction.code;
    restriction.effectiveDate = getISODateOnlyString(
      sfasRestriction.effectiveDate,
    );
    restriction.removalDate = getISODateOnlyString(sfasRestriction.removalDate);
    restriction.extractedAt = getUTC(extractedDate);
    await this.repo.save(restriction, { reload: false, transaction: false });
  }

  @InjectLogger()
  logger: LoggerService;
}
