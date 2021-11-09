import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASApplication } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { getUTC } from "../../utilities";
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
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SFASApplication));
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
    const sfasApplication = new SFASApplicationRecord(record.line);
    const application = new SFASApplication();
    application.id = sfasApplication.applicationId;
    application.individualId = sfasApplication.individualId;
    application.startDate = sfasApplication.startDate;
    application.endDate = sfasApplication.endDate;
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
    application.applicationCancelDate = sfasApplication.applicationCancelDate;
    application.extractedAt = getUTC(extractedDate);
    await this.repo.save(application, { reload: false, transaction: false });
  }

  @InjectLogger()
  logger: LoggerService;
}
