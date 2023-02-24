import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DataModelService, SFASIndividual } from "@sims/sims-db";
import { SFASIndividualRecord } from "../../sfas-integration/sfas-files/sfas-individual-record";
import { getUTC, getISODateOnlyString, getSQLFileData } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";

const SFAS_INDIVIDUALS_RAW_SQL_FOLDER = "sfas-individuals";
const DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER = "disbursement-overawards";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualService
  extends DataModelService<SFASIndividual>
  implements SFASDataImporter
{
  private readonly bulkUpdateStudentIdSQL: string;
  private readonly bulkUpdateBCSLDisbursementOverawardSQL: string;
  private readonly bulkUpdateCSLFDisbursementOverawardSQL: string;
  private readonly bulkInsertBCSLDisbursementOverawardSQL: string;
  private readonly bulkInsertCSLFDisbursementOverawardSQL: string;
  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASIndividual));
    this.bulkUpdateStudentIdSQL = getSQLFileData(
      "Bulk-update-students-foreign-key.sql",
      SFAS_INDIVIDUALS_RAW_SQL_FOLDER,
    );
    this.bulkUpdateBCSLDisbursementOverawardSQL = getSQLFileData(
      "Bulk-update-bcsl-disbursement-overaward.sql",
      DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER,
    );
    this.bulkUpdateCSLFDisbursementOverawardSQL = getSQLFileData(
      "Bulk-update-cslf-disbursement-overaward.sql",
      DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER,
    );
    this.bulkInsertBCSLDisbursementOverawardSQL = getSQLFileData(
      "Bulk-insert-bcsl-disbursement-overaward.sql",
      DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER,
    );
    this.bulkInsertCSLFDisbursementOverawardSQL = getSQLFileData(
      "Bulk-insert-cslf-disbursement-overaward.sql",
      DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER,
    );
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
    // The insert of SFAS record always comes from an external source through integration.
    // Hence all the date fields are parsed as date object from external source as their date format
    // may not be necessarily ISO date format.
    const sfasIndividual = new SFASIndividualRecord(record.line);
    const individual = new SFASIndividual();
    individual.id = sfasIndividual.id;
    individual.firstName = sfasIndividual.givenNames;
    individual.lastName = sfasIndividual.lastName;
    individual.birthDate = getISODateOnlyString(sfasIndividual.birthDate);
    individual.sin = sfasIndividual.sin;
    individual.pdStatus = sfasIndividual.pdStatus;
    individual.msfaaNumber = sfasIndividual.msfaaNumber;
    individual.msfaaSignedDate = getISODateOnlyString(
      sfasIndividual.msfaaSignedDate,
    );
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
   * Bulk operation to update student id in SFAS individuals table after importing data from SFAS.
   */
  async updateStudentId(): Promise<void> {
    await this.repo.manager.query(this.bulkUpdateStudentIdSQL);
  }

  /**
   * Bulk operation to update BCSL disbursement overawards with overawards from SFAS individuals data.
   */
  async updateBCSLDisbursementOveraward(): Promise<void> {
    await this.repo.manager.query(this.bulkUpdateBCSLDisbursementOverawardSQL);
  }

  /**
   * Bulk operation to insert BCSL disbursement overawards with overawards from SFAS individuals data.
   */
  async insertBCSLDisbursementOveraward(): Promise<void> {
    await this.repo.manager.query(this.bulkInsertBCSLDisbursementOverawardSQL);
  }

  /**
   * Bulk operation to update CSLF disbursement overawards with overawards from SFAS individuals data.
   */
  async updateCSLFDisbursementOveraward(): Promise<void> {
    await this.repo.manager.query(this.bulkUpdateCSLFDisbursementOverawardSQL);
  }

  /**
   * Bulk operation to insert CSLF disbursement overawards with overawards from SFAS individuals data.
   */
  async insertCSLFDisbursementOveraward(): Promise<void> {
    await this.repo.manager.query(this.bulkInsertCSLFDisbursementOverawardSQL);
  }

  async updateDisbursementOverawards(): Promise<void> {
    await this.updateStudentId();
    // Update BCSL and CSL overawards in parallel
    const updateBCSLDisbursementOverawardPromise =
      this.updateBCSLDisbursementOveraward();
    const updateCSLFDisbursementOverawardPromise =
      this.updateCSLFDisbursementOveraward();
    await Promise.all([
      updateBCSLDisbursementOverawardPromise,
      updateCSLFDisbursementOverawardPromise,
    ]);
    // Insert BCSL and CSL overawards in parallel
    const insertBCSLDisbursementOverawardPromise =
      this.insertBCSLDisbursementOveraward();
    const insertCSLFDisbursementOverawardPromise =
      this.insertCSLFDisbursementOveraward();
    await Promise.all([
      insertBCSLDisbursementOverawardPromise,
      insertCSLFDisbursementOverawardPromise,
    ]);
  }
}
