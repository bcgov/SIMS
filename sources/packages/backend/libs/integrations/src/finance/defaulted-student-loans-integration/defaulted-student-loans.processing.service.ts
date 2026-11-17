import { Injectable } from "@nestjs/common";
import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { SequenceControlService } from "@sims/services";
import {
  ConfigService,
  FinanceIntegrationConfig,
} from "@sims/utilities/config";
import { IndividualReturnedLoan } from "../../esdc-integration";
import { DefaultedStudentLoansIntegrationService } from "./defaulted-student-loans.integration.service";

/**
 * Sequence group name for defaulted student loans file sequence control.
 */
const SEQUENCE_GROUP_NAME = "DEFAULTED_STUDENT_LOANS_FILE";

/**
 * Eligible return reasons for processing defaulted student loans.
 */
const ELIGIBLE_RETURN_REASONS = new Set(["A270", "S90"]);

@Injectable()
export class DefaultedStudentLoansProcessingService {
  private readonly financeIntegrationConfig: FinanceIntegrationConfig;
  constructor(
    private readonly sequenceService: SequenceControlService,
    private readonly integrationService: DefaultedStudentLoansIntegrationService,
    private readonly logger: LoggerService,
    config: ConfigService,
  ) {
    this.financeIntegrationConfig = config.financeIntegration;
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
    const eligibleReturnedLoans = individualReturnedLoans.filter((loan) =>
      ELIGIBLE_RETURN_REASONS.has(loan.returnedLoan.returnReason),
    );
    if (!eligibleReturnedLoans.length) {
      processSummary.info(
        "No eligible returned loans to process for defaulted student loans file generation.",
      );
      return;
    }
    const beginProcessingInfo = `Processing ${eligibleReturnedLoans.length} returned loan(s) for defaulted student loans file generation.`;
    // Adding logger to indicate that the processing has started without waiting for the process summary to log later.
    this.logger.log(beginProcessingInfo);
    processSummary.info(beginProcessingInfo);
    try {
      await this.sequenceService.consumeNextSequence(
        SEQUENCE_GROUP_NAME,
        async (nextSequenceNumber: number) => {
          const fileContent =
            this.integrationService.createDefaultedStudentLoansFileContent(
              eligibleReturnedLoans,
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
   * @returns object containing the filename and full file path.
   */
  private createFileName(): {
    fileName: string;
    filePath: string;
  } {
    // The file name format is not final. It is subject to change based response from RMS team.
    const fileName = "STLDLLAB.DAT";
    const filePath = `${this.financeIntegrationConfig.ftpRequestFolder}\\${fileName}`;
    return { fileName, filePath };
  }
}
