import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DataModelService } from "../../database/data.model.service";
import { SFASIndividual } from "../../database/entities";
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
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASIndividual));
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
    await this.repo.save(individual, { reload: false, transaction: false });
  }

  /**
   * Get the permanent disability status from SFAS, if available.
   * @param lastName student last name.
   * @param birthDate student data of birth.
   * @param sin student Social Insurance Number.
   * @returns the permanent disability if present or null. Even when
   * the record is present os SFAS, the value could still be null,
   * what means that a permanent disability verification was never
   * executed for the student.
   */
  async getPDStatus(
    lastName: string,
    birthDate: Date,
    sin: string,
  ): Promise<boolean | null> {
    const individual = await this.repo
      .createQueryBuilder("individual")
      .select("individual.pdStatus")
      .where("lower(individual.lastName) = :lastName", {
        lastName: lastName.toLowerCase(),
      })
      .andWhere("individual.sin = :sin", { sin })
      .andWhere("individual.birthDate = :birthDate", { birthDate })
      .getOne();

    return individual?.pdStatus;
  }
}
