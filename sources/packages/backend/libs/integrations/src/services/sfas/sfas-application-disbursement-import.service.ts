import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { SFASApplication, SFASApplicationDisbursement } from "@sims/sims-db";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { getISODateOnlyString } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { InjectRepository } from "@nestjs/typeorm";
import {
  SFASApplicationDisbursementRecord,
  SFASRecordIdentification,
} from "../../sfas-integration/sfas-files";

/**
 * Manages the import of SFAS application disbursement data.
 */
@Injectable()
export class SFASApplicationDisbursementImportService
  implements SFASDataImporter
{
  constructor(
    @InjectRepository(SFASApplicationDisbursement)
    private readonly sfasApplicationDisbursementRepo: Repository<SFASApplicationDisbursement>,
  ) {}
  /**
   * Process the import of a SFAS disbursement record.
   * @param record SFAS disbursement record.
   * @param extractedDate extracted date from the file header.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    // Read the disbursement record from the file.
    const sfasApplicationDisbursementRecord =
      new SFASApplicationDisbursementRecord(record.line);
    // Save the disbursement record.
    const sfasApplicationDisbursement = new SFASApplicationDisbursement();
    sfasApplicationDisbursement.id =
      sfasApplicationDisbursementRecord.disbursementId;
    sfasApplicationDisbursement.application = {
      id: sfasApplicationDisbursementRecord.applicationId,
    } as SFASApplication;
    sfasApplicationDisbursement.fundingType =
      sfasApplicationDisbursementRecord.fundingType;
    sfasApplicationDisbursement.fundingAmount =
      sfasApplicationDisbursementRecord.fundingAmount;
    sfasApplicationDisbursement.fundingDate = getISODateOnlyString(
      sfasApplicationDisbursementRecord.fundingDate,
    );
    sfasApplicationDisbursement.dateIssued = getISODateOnlyString(
      sfasApplicationDisbursementRecord.dateIssued,
    );
    sfasApplicationDisbursement.extractedAt = extractedDate;
    await this.sfasApplicationDisbursementRepo.save(
      sfasApplicationDisbursement,
      {
        reload: false,
        transaction: false,
      },
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
