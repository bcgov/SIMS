import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import {
  DataModelService,
  DisbursementOverawardOriginType,
  SFASIndividual,
} from "@sims/sims-db";
import { SFASIndividualRecord } from "../../sfas-integration/sfas-files/sfas-individual-record";
import { getUTC, getISODateOnlyString, getSQLFileData } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import {
  BC_STUDENT_LOAN_AWARD_CODE,
  CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
} from "@sims/services/constants";
import { SYSTEM_USER_USER_NAME } from "@sims/services/system-users/system-users.models";

const SFAS_INDIVIDUALS_RAW_SQL_FOLDER = "sfas-individuals";
const DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER = "disbursement-overawards";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASIndividualImportService
  extends DataModelService<SFASIndividual>
  implements SFASDataImporter
{
  private readonly bulkUpdateStudentIdSQL: string;
  private readonly bulkUpdateDisbursementOverawardSQL: string;
  private readonly bulkInsertDisbursementOverawardSQL: string;

  constructor(dataSource: DataSource) {
    super(dataSource.getRepository(SFASIndividual));
    this.bulkUpdateStudentIdSQL = getSQLFileData(
      "Bulk-update-students-foreign-key.sql",
      SFAS_INDIVIDUALS_RAW_SQL_FOLDER,
    );

    this.bulkUpdateDisbursementOverawardSQL = getSQLFileData(
      "Bulk-update-disbursement-overaward.sql",
      DISBURSEMENT_OVERAWARD_RAW_SQL_FOLDER,
    );

    this.bulkInsertDisbursementOverawardSQL = getSQLFileData(
      "Bulk-insert-disbursement-overaward.sql",
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
    individual.ppdStatus = sfasIndividual.ppdStatus;
    individual.ppdStatusDate = getISODateOnlyString(
      sfasIndividual.ppdStatusDate,
    );
    individual.msfaaNumber = sfasIndividual.msfaaNumber?.toString();
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
    individual.partTimeMSFAANumber =
      sfasIndividual.partTimeMSFAANumber?.toString();
    individual.partTimeMSFAAEffectiveDate = getISODateOnlyString(
      sfasIndividual.partTimeMSFAAEffectiveDate,
    );
    individual.initials = sfasIndividual.initials;
    individual.addressLine1 = sfasIndividual.addressLine1;
    individual.addressLine2 = sfasIndividual.addressLine2;
    individual.city = sfasIndividual.city;
    individual.provinceState = sfasIndividual.provinceState;
    individual.country = sfasIndividual.country;
    individual.phoneNumber = sfasIndividual.phoneNumber;
    individual.postalZipCode = sfasIndividual.postalZipCode;
    individual.lmptAwardAmount = sfasIndividual.lmptAwardAmount;
    individual.lmpuAwardAmount = sfasIndividual.lmpuAwardAmount;
    await this.repo.save(individual, { reload: false, transaction: false });
  }

  /**
   * Bulk operation to update student id in SFAS individuals table after importing data from SFAS.
   */
  async updateStudentId(): Promise<void> {
    try {
      await this.repo.manager.query(this.bulkUpdateStudentIdSQL);
    } catch (error) {
      throw new Error("Error while updating student ids imported from SFAS.", {
        cause: error,
      });
    }
  }

  /**
   * Bulk operation to update disbursement overawards with overawards from SFAS individuals data.
   */
  private async updateDisbursementOveraward(
    disbursementValueCode: string,
    originType: DisbursementOverawardOriginType,
    auditUserName: string,
  ): Promise<void> {
    await this.repo.manager.query(this.bulkUpdateDisbursementOverawardSQL, [
      disbursementValueCode,
      originType,
      auditUserName,
    ]);
  }

  /**
   * Bulk operation to insert disbursement overawards with overawards from SFAS individuals data.
   */
  private async insertDisbursementOveraward(
    disbursementValueCode: string,
    originType: DisbursementOverawardOriginType,
    auditUserName: string,
  ): Promise<void> {
    await this.repo.manager.query(this.bulkInsertDisbursementOverawardSQL, [
      disbursementValueCode,
      originType,
      auditUserName,
    ]);
  }

  /**
   * Updates and inserts new disbursement overaward balances from sfas to disbursement overawards table.
   */
  async updateDisbursementOverawards(): Promise<void> {
    try {
      // Update BCSL and CSL overawards in parallel
      const updateBCSLDisbursementOverawardPromise =
        this.updateDisbursementOveraward(
          SYSTEM_USER_USER_NAME,
          DisbursementOverawardOriginType.LegacyOveraward,
          BC_STUDENT_LOAN_AWARD_CODE,
        );
      const updateCSLFDisbursementOverawardPromise =
        this.updateDisbursementOveraward(
          SYSTEM_USER_USER_NAME,
          DisbursementOverawardOriginType.LegacyOveraward,
          CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
        );
      await Promise.all([
        updateBCSLDisbursementOverawardPromise,
        updateCSLFDisbursementOverawardPromise,
      ]);
      // Insert BCSL and CSL overawards in parallel
      const insertBCSLDisbursementOverawardPromise =
        this.insertDisbursementOveraward(
          BC_STUDENT_LOAN_AWARD_CODE,
          DisbursementOverawardOriginType.LegacyOveraward,
          SYSTEM_USER_USER_NAME,
        );
      const insertCSLFDisbursementOverawardPromise =
        this.insertDisbursementOveraward(
          CANADA_STUDENT_LOAN_FULL_TIME_AWARD_CODE,
          DisbursementOverawardOriginType.LegacyOveraward,
          SYSTEM_USER_USER_NAME,
        );
      await Promise.all([
        insertBCSLDisbursementOverawardPromise,
        insertCSLFDisbursementOverawardPromise,
      ]);
    } catch (error) {
      throw new Error(
        "Error while updating overawards balances imported from SFAS.",
        {
          cause: error,
        },
      );
    }
  }
}
