import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASPartTimeApplications } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { getUTC } from "../../utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASPartTimeApplicationRecord } from "../../sfas-integration/sfas-files/sfas-part-time-application-record";

/**
 * Manages the part time application data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASPartTimeApplicationsService
  extends DataModelService<SFASPartTimeApplications>
  implements SFASDataImporter
{
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SFASPartTimeApplications));
  }

  /**
   * Import a record from SFAS. This method will be invoked by SFAS
   * import processing service when the record type is detected as
   * RecordTypeCodes.PartTimeApplicationDataRecord.
   * ! when this scenarios was tested with test data, it was
   * ! having application id duplication with different
   * ! individual id, which will not happen in production
   * ! as confirmed from client.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    const sfasApplication = new SFASPartTimeApplicationRecord(record.line);
    const application = new SFASPartTimeApplications();
    application.individualId = sfasApplication.individualId;
    application.id = sfasApplication.applicationId;
    application.startDate = sfasApplication.startDate;
    application.endDate = sfasApplication.endDate;
    application.CSGPAward = sfasApplication.CSGPAward;
    application.SBSDAward = sfasApplication.SBSDAward;
    application.extractedAt = getUTC(extractedDate);
    await this.repo.save(application, { reload: false, transaction: false });
  }

  @InjectLogger()
  logger: LoggerService;
}
