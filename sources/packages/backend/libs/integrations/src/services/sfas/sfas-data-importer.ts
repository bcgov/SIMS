import { SFASRecordIdentification } from "../../sfas-integration/sfas-files/sfas-record-identification";

/**
 * Common method that services importing data from SFAS must
 * implement to process a SFAS record being imported.
 */
export interface SFASDataImporter {
  /**
   * Process the import process of a SFAS record.
   * @param record record to be imported.
   * @param extractedDate date and time that the record
   * was extracted from SFAS.
   */
  importSFASRecord(
    record: SFASRecordIdentification,
    extractedDate: Date,
  ): Promise<void>;
}
