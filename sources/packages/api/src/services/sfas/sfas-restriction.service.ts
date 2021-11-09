import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASRestriction } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { getUTC } from "../../utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASRestrictionRecord } from "../../sfas-integration/sfas-files/sfas-restriction-record";

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
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SFASRestriction));
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
    const sfasRestriction = new SFASRestrictionRecord(record.line);
    const restriction = new SFASRestriction();
    restriction.id = sfasRestriction.restrictionId;
    restriction.individualId = sfasRestriction.individualId;
    restriction.code = sfasRestriction.code;
    restriction.effectiveDate = sfasRestriction.effectiveDate;
    restriction.removalDate = sfasRestriction.removalDate;
    restriction.extractedAt = getUTC(extractedDate);
    await this.repo.save(restriction, { reload: false, transaction: false });
  }

  @InjectLogger()
  logger: LoggerService;
}
