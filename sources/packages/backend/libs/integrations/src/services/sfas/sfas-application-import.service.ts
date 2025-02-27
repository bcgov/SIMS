import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { DataModelService, SFASApplication } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { getUTC, getISODateOnlyString } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";
import { SFASApplicationRecord } from "../../sfas-integration/sfas-files/sfas-application-record";

/**
 * Manages the data related to an individual/student in SFAS.
 */
@Injectable()
export class SFASApplicationImportService
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
    application.applicationNumber = sfasApplication.applicationNumber;
    application.livingArrangements = sfasApplication.livingArrangements;
    application.maritalStatus = sfasApplication.maritalStatus;
    application.marriageDate = getISODateOnlyString(
      sfasApplication.marriageDate,
    );
    application.bcResidencyFlag = sfasApplication.bcResidencyFlag;
    application.permanentResidencyFlag = sfasApplication.permanentResidencyFlag;
    application.grossIncomePreviousYear =
      sfasApplication.grossIncomePreviousYear;
    application.institutionCode = sfasApplication.institutionCode;
    application.applicationStatusCode = sfasApplication.applicationStatusCode;
    application.educationPeriodWeeks = sfasApplication.educationPeriodWeeks;
    application.courseLoad = sfasApplication.courseLoad;
    application.assessedCostsLivingAllowance =
      sfasApplication.assessedCostsLivingAllowance;
    application.assessedCostsExtraShelter =
      sfasApplication.assessedCostsExtraShelter;
    application.assessedCostsChildCare = sfasApplication.assessedCostsChildCare;
    application.assessedCostsAlimony = sfasApplication.assessedCostsAlimony;
    application.assessedCostsLocalTransport =
      sfasApplication.assessedCostsLocalTransport;
    application.assessedCostsReturnTransport =
      sfasApplication.assessedCostsReturnTransport;
    application.assessedCostsTuition = sfasApplication.assessedCostsTuition;
    application.assessedCostsBooksAndSupplies =
      sfasApplication.assessedCostsBooksAndSupplies;
    application.assessedCostsExceptionalExpenses =
      sfasApplication.assessedCostsExceptionalExpenses;
    application.assessedCostsOther = sfasApplication.assessedCostsOther;
    application.assessedEligibleNeed = sfasApplication.assessedEligibleNeed;
    application.withdrawalDate = getISODateOnlyString(
      sfasApplication.withdrawalDate,
    );
    application.withdrawalReason = sfasApplication.withdrawalReason;
    application.withdrawalActiveFlag = sfasApplication.withdrawalActiveFlag;
    await this.repo.save(application, { reload: false, transaction: false });
  }

  @InjectLogger()
  logger: LoggerService;
}
