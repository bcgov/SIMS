import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { SFASApplication, SFASApplicationDependant } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { SFASDataImporter } from "./sfas-data-importer";
import { InjectRepository } from "@nestjs/typeorm";
import {
  SFASRecordIdentification,
  SFASApplicationDependantRecord,
} from "../../sfas-integration/sfas-files";

/**
 * Manages the import of SFAS application dependant data.
 */
@Injectable()
export class SFASApplicationDependantImportService implements SFASDataImporter {
  constructor(
    @InjectRepository(SFASApplicationDependant)
    private readonly sfasApplicationDependantRepo: Repository<SFASApplicationDependant>,
  ) {}
  /**
   * Process the import of a SFAS dependant record.
   * @param record SFAS dependant record.
   * @param extractedDate extracted date from the file header.
   */
  async importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void> {
    // Read the dependant record from the file.
    const sfasApplicationDependantRecord = new SFASApplicationDependantRecord(
      record.line,
    );
    // Save the dependant record.
    const sfasApplicationDependant = new SFASApplicationDependant();
    sfasApplicationDependant.id = sfasApplicationDependantRecord.dependantId;
    sfasApplicationDependant.application = {
      id: sfasApplicationDependantRecord.applicationId,
    } as SFASApplication;
    sfasApplicationDependant.dependantName =
      sfasApplicationDependantRecord.dependantName;
    sfasApplicationDependant.dependantBirthDate = getISODateOnlyString(
      sfasApplicationDependantRecord.dependantBirthDate,
    );
    sfasApplicationDependant.extractedAt = extractedDate;
    await this.sfasApplicationDependantRepo.save(sfasApplicationDependant, {
      reload: false,
      transaction: false,
    });
  }
}
