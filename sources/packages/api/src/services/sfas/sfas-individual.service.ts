import { Inject, Injectable } from "@nestjs/common";
import { Connection } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASIndividual } from "../../database/entities";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { SFASIndividualRecord } from "../../sfas-integration/sfas-files/sfas-individual-record";
import { getUTC } from "../../utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService
  extends DataModelService<SFASIndividual>
  implements SFASDataImporter
{
  constructor(@Inject("Connection") connection: Connection) {
    super(connection.getRepository(SFASIndividual));
  }

  /**
   * Import a record from SFAS. This method will be invoked by SFAS
   * import processing service when the record type is detected as
   * RecordTypeCodes.IndividualDataRecord.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    const sfasIndividual = new SFASIndividualRecord(record.line);
    const individual = new SFASIndividual();
    individual.id = sfasIndividual.id;
    individual.firstName = sfasIndividual.givenNames;
    individual.lastName = sfasIndividual.lastName;
    individual.birthDate = sfasIndividual.birthDate;
    individual.sin = sfasIndividual.sin;
    individual.pdStatus = sfasIndividual.pdStatus;
    individual.msfaaNumber = sfasIndividual.msfaaNumber;
    individual.msfaaSignedDate = sfasIndividual.msfaaSignedDate;
    individual.neb = sfasIndividual.neb;
    individual.bcgg = sfasIndividual.bcgg;
    individual.lfp = sfasIndividual.lfp;
    individual.pal = sfasIndividual.pal;
    individual.cslOveraward = sfasIndividual.cslOveraward;
    individual.bcslOveraward = sfasIndividual.bcslOveraward;
    individual.cmsOveraward = sfasIndividual.cmsOveraward;
    individual.grantOveraward = sfasIndividual.grantOveraward;
    individual.withdrawals = sfasIndividual.withdrawals;
    individual.unsuccessfulCompletion = sfasIndividual.unsuccessfulCompletion;
    individual.extractedAt = getUTC(extractedDate);
    await this.repo.save(individual);
  }

  @InjectLogger()
  logger: LoggerService;
}
