import { Injectable } from "@nestjs/common";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { SequenceControlService } from "@sims/services";
import { getFileNameAsExtendedCurrentTimestamp } from "@sims/utilities";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { IndividualReturnedLoan } from "../../esdc-integration";
import { DefaultedStudentLoansIntegrationService } from "./defaulted-student-loans.integration.service";

/**
 * Sequence group name for defaulted student loans file sequence control.
 */
const SEQUENCE_GROUP_NAME = "DEFAULTED_STUDENT_LOANS_FILE";

@Injectable()
export class DefaultedStudentLoansProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly sequenceService: SequenceControlService,
    private readonly integrationService: DefaultedStudentLoansIntegrationService,
    private readonly logger: LoggerService,
    config: ConfigService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Processes the defaulted student loans by creating and uploading a file with the returned loans.
   * @param individualReturnedLoans array of individual returned loans to process.
   * @param processSummary process summary for logging.
   */
  async processDefaultedStudentLoans(
    individualReturnedLoans: IndividualReturnedLoan[],
    processSummary: ProcessSummary,
  ): Promise<void> {
    if (!individualReturnedLoans.length) {
      processSummary.info("No individual returned loans to process.");
      return;
    }
    const beginProcessingInfo = `Processing ${individualReturnedLoans.length} returned loan(s).`;
    // Adding logger to indicate that the processing has started without waiting for the process summary to log later.
    this.logger.log(beginProcessingInfo);
    processSummary.info(beginProcessingInfo);
    try {
      await this.sequenceService.consumeNextSequence(
        SEQUENCE_GROUP_NAME,
        async (nextSequenceNumber: number) => {
          const fileContent =
            this.integrationService.createDefaultedStudentLoansFileContent(
              individualReturnedLoans,
              nextSequenceNumber,
            );
          const { fileName, filePath } = this.createFileName();
          await this.integrationService.uploadContent(fileContent, filePath);
          processSummary.info(
            `Uploaded defaulted student loans file: ${fileName}.`,
          );
        },
      );
    } catch (error: unknown) {
      processSummary.error(
        "Unexpected error occurred while processing defaulted student loans.",
        error,
      );
      throw error;
    }
  }

  /**
   * Creates the defaulted student loans request filename.
   * File format: STLDLLAB-YYYYMMDD-SEQUENCE_NUMBER.DAT
   * @returns object containing the filename and full file path.
   */
  private createFileName(): {
    fileName: string;
    filePath: string;
  } {
    const timestamp = getFileNameAsExtendedCurrentTimestamp();
    // The file name format is not final. It is subject to change based response from RMS team.
    const fileName = `STLDLLAB-${timestamp}.DAT`;
    const filePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return { fileName, filePath };
  }
}
