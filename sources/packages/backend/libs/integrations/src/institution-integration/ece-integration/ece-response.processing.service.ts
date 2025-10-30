import { Injectable } from "@nestjs/common";
import * as path from "path";
import { LoggerService } from "@sims/utilities/logger";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { ProcessSummaryResult } from "@sims/integrations/models";
import { ECE_RESPONSE_COE_DECLINED_REASON } from "@sims/integrations/constants";
import {
  DisbursementScheduleService,
  InstitutionLocationService,
} from "@sims/integrations/services";
import {
  COE_DENIED_REASON_OTHER_ID,
  CustomNamedError,
  END_OF_LINE,
  StringBuilder,
  parseJSONError,
  processInParallel,
} from "@sims/utilities";
import { ECEResponseFileDetail } from "./ece-files/ece-response-file-detail";
import {
  DisbursementDetails,
  DisbursementProcessingDetails,
  ECEDisbursements,
  YNOptions,
} from "./models/ece-integration.model";
import {
  ConfirmationOfEnrollmentService,
  ECEResponseFileProcessingNotification,
  NotificationActionsService,
  SystemUsersService,
} from "@sims/services";
import {
  ECE_DISBURSEMENT_DATA_NOT_VALID,
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FILE_PARSING_ERROR,
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
  UNEXPECTED_ERROR_DOWNLOADING_FILE,
} from "@sims/services/constants";
import { InstitutionLocation } from "@sims/sims-db";

/**
 * Read and process the ECE response files which are
 * downloaded from SFTP location.
 */
@Injectable()
export class ECEResponseProcessingService {
  private readonly institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly integrationService: ECEResponseIntegrationService,
    private readonly institutionLocationService: InstitutionLocationService,
    private readonly confirmationOfEnrollmentService: ConfirmationOfEnrollmentService,
    private readonly systemUsersService: SystemUsersService,
    private readonly notificationActionsService: NotificationActionsService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly logger: LoggerService,
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * Process all the available ECE response files in SFTP location.
   * Once the file is processed, it is archived.
   * @returns Process summary result.
   */
  async process(): Promise<ProcessSummaryResult[]> {
    // Get all the ECE response files from the SFTP location.
    // The institution code is expected between 9th and 12th characters in the file name,
    // and it is required to group the files by institution code for processing.
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.institutionIntegrationConfig.ftpResponseFolder,
      /^CONR-008-[A-Z]{4}-\d{8}-\d{6}\.TXT$/i,
    );

    if (!filePaths.length) {
      this.logger.log("No ECE response files found to be processed.");
      return [];
    }
    this.logger.log(
      `Received ${filePaths.length} ece response file(s) to process.`,
    );

    const filesByInstitutions = this.groupFilesByInstitutionCode(filePaths);

    // Process all the files in parallel.
    const result = await processInParallel(
      ([institutionCode, filePaths]) =>
        this.processInstitutionFiles(institutionCode, filePaths),
      [...filesByInstitutions],
    );
    return result;
  }

  /**
   * Group the files by institution code to allow the parallel processing
   * of distinct institution files while files of the same institution
   * are processed sequentially.
   * @param filePaths all file paths that need to be processed.
   * @returns a map of file paths grouped by institution code.
   */
  private groupFilesByInstitutionCode(
    filePaths: string[],
  ): Map<string, string[]> {
    const filesByInstitution = new Map<string, string[]>();
    for (const filePath of filePaths) {
      const fileName = path.basename(filePath);
      // The file name is expected to match the pattern 'CONR-008-XXXX-....'.
      // The institution code is the 4 alpha characters after 'CONR-008-'.
      const institutionCode = fileName.substring(9, 13);
      if (!filesByInstitution.has(institutionCode)) {
        filesByInstitution.set(institutionCode, []);
      }
      filesByInstitution.get(institutionCode).push(filePath);
    }
    return filesByInstitution;
  }

  /**
   * Process all the files for a given institution, sequentially.
   * @param institutionCode institution code.
   * @param remoteFilePaths remote file paths for a given institution.
   * @returns process summary result.
   */
  private async processInstitutionFiles(
    institutionCode: string,
    remoteFilePaths: string[],
  ): Promise<ProcessSummaryResult> {
    const processSummary = new ProcessSummaryResult();
    // Log the files to be processed for the institution.
    processSummary.summary.push(
      `Processing file(s) for institution code: ${institutionCode}, files: ${remoteFilePaths.map((filePath) => path.basename(filePath)).join(", ")}.`,
    );
    const integrationLocation =
      await this.institutionLocationService.getIntegrationLocation(
        institutionCode,
      );
    //If the file does not have integration location hasIntegration flag set to true, skip the file.
    if (!integrationLocation) {
      processSummary.warnings.push(
        `Integration location not found for institution code: ${institutionCode}.`,
      );
      return processSummary;
    }
    // Process each file for the institution sequentially.
    for (const filePath of remoteFilePaths) {
      await this.processDisbursementsInECEResponseFile(
        integrationLocation,
        filePath,
        processSummary,
      );
    }
    return processSummary;
  }

  /**
   * Process individual ECE response file sent by institution.
   * @param remoteFilePath remote file path.
   * @returns process summary result.
   */
  private async processDisbursementsInECEResponseFile(
    integrationLocation: InstitutionLocation,
    remoteFilePath: string,
    processSummary: ProcessSummaryResult,
  ): Promise<ProcessSummaryResult> {
    // Start processing the file.
    processSummary.summary.push(`Starting download of file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    // Disbursement processing count.
    const disbursementProcessingDetails = new DisbursementProcessingDetails();
    try {
      const eceFileDetailRecords =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      // Set the total records count.
      disbursementProcessingDetails.totalRecords = eceFileDetailRecords.length;
      // Sanitize all the ece response detail records.
      this.sanitizeDisbursements(
        eceFileDetailRecords,
        processSummary,
        disbursementProcessingDetails,
      );
      // Transform ECE response detail records to disbursements which could be individually processed.
      const disbursementsToProcess =
        await this.transformDetailRecordsToDisbursements(
          eceFileDetailRecords,
          processSummary,
          disbursementProcessingDetails,
        );
      const auditUser = this.systemUsersService.systemUser;
      await this.validateAndUpdateEnrolmentStatus(
        disbursementsToProcess,
        auditUser.id,
        processSummary,
        disbursementProcessingDetails,
      );

      this.logger.log(`Completed processing the file ${remoteFilePath}.`);
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        [UNEXPECTED_ERROR_DOWNLOADING_FILE, FILE_PARSING_ERROR].includes(
          error.name,
        )
      ) {
        // In the event of runtime error during downloading the file or parsing the file.
        ++disbursementProcessingDetails.fileParsingErrors;
      }
      this.logger.error(error);
      processSummary.errors.push(
        `Error processing the file ${remoteFilePath}. ${error}`,
      );
      processSummary.errors.push("File processing aborted.");
    } finally {
      // Archive the ECE response file, if the file exist in remote server.
      await this.archiveProcessedFile(remoteFilePath, processSummary);

      // Create notification email which gets sent to
      // the integration contacts of the institution
      // when a ECE file exists for an institution.
      await this.createECEResponseProcessingNotification(
        integrationLocation,
        disbursementProcessingDetails,
        processSummary,
      );
    }

    // Populate the process summary count.
    processSummary.summary.push(
      `Total file parsing errors: ${disbursementProcessingDetails.fileParsingErrors}`,
      `Total detail records found: ${disbursementProcessingDetails.totalRecords}`,
      `Total detail records skipped: ${disbursementProcessingDetails.totalRecordsSkipped}`,
      `Total disbursements found: ${disbursementProcessingDetails.totalDisbursements}`,
      `Disbursements successfully updated: ${disbursementProcessingDetails.disbursementsSuccessfullyProcessed}`,
      `Disbursements skipped to be processed: ${disbursementProcessingDetails.disbursementsSkipped}`,
      `Disbursements considered duplicate and skipped: ${disbursementProcessingDetails.duplicateDisbursements}`,
      `Disbursements failed to process: ${disbursementProcessingDetails.disbursementsFailedToProcess}`,
    );
    return processSummary;
  }

  /**
   * Sanitize all the disbursement records before processing.
   * @param eceFileDetailRecords ECE disbursement records
   * @param processSummaryResult process summary result.
   */
  private sanitizeDisbursements(
    eceFileDetailRecords: ECEResponseFileDetail[],
    processSummaryResult: ProcessSummaryResult,
    disbursementProcessingDetails: DisbursementProcessingDetails,
  ): void {
    let hasErrors = false;
    for (const eceDetailRecord of eceFileDetailRecords) {
      const errorMessage = eceDetailRecord.getInvalidDataMessage();
      if (errorMessage) {
        hasErrors = true;
        ++disbursementProcessingDetails.fileParsingErrors;
        processSummaryResult.errors.push(
          `${errorMessage} at line ${eceDetailRecord.lineNumber}.`,
        );
      }
    }
    if (hasErrors) {
      throw new Error(
        "The file consists of invalid data and cannot be processed.",
      );
    }
  }

  /**
   * Transform the detail records to individual disbursements.
   * @param eceFileDetailRecords detail records of ece file.
   * @returns disbursements to be processed.
   */
  private async transformDetailRecordsToDisbursements(
    eceFileDetailRecords: ECEResponseFileDetail[],
    processSummary: ProcessSummaryResult,
    disbursementProcessingDetails: DisbursementProcessingDetails,
  ): Promise<ECEDisbursements> {
    const disbursementValueIds = eceFileDetailRecords.map(
      (record) => record.disbursementValueId,
    );
    const disbursementScheduleValuesMap =
      await this.disbursementScheduleService.getDisbursementScheduleValuesMap(
        disbursementValueIds,
      );
    const disbursements = {} as ECEDisbursements;
    for (const record of eceFileDetailRecords) {
      const scheduleId =
        disbursementScheduleValuesMap[record.disbursementValueId];
      if (!scheduleId) {
        // Disbursement schedule not found for the disbursement value ID.
        processSummary.warnings.push(
          `Disbursement schedule not found for disbursement value ID: ${record.disbursementValueId}, record at line ${record.lineNumber} skipped.`,
        );
        ++disbursementProcessingDetails.totalRecordsSkipped;
        continue;
      }
      if (!disbursements[scheduleId]) {
        disbursements[scheduleId] = {
          institutionCode: record.institutionCode,
          applicationNumber: record.applicationNumber,
          awardDetails: [],
        };
      }
      disbursements[scheduleId].awardDetails.push({
        payToSchoolAmount: record.payToSchoolAmount,
        enrolmentConfirmationFlag: record.enrolmentConfirmationFlag,
        enrolmentConfirmationDate: record.enrolmentConfirmationDate,
      });
    }
    return disbursements;
  }

  /**
   * Validate the disbursement and application and
   * update the enrolment status.
   * @param disbursements disbursements to be processed,
   * @param auditUserId user who confirm or decline the enrolment.
   * @param processSummary process summary.
   * @returns count of disbursements processed, successfully updated, skipped and failed.
   */
  private async validateAndUpdateEnrolmentStatus(
    disbursements: ECEDisbursements,
    auditUserId: number,
    processSummary: ProcessSummaryResult,
    disbursementProcessingDetails: DisbursementProcessingDetails,
  ): Promise<DisbursementProcessingDetails> {
    const disbursementSchedules = Object.entries(disbursements);
    // Total disbursements.
    disbursementProcessingDetails.totalDisbursements =
      disbursementSchedules.length;
    for (const [
      disbursementScheduleId,
      disbursementDetails,
    ] of disbursementSchedules) {
      try {
        this.validateDisbursement(disbursementDetails);
        const confirmedEnrolmentDetails = disbursementDetails.awardDetails.find(
          (awardDetail) =>
            awardDetail.enrolmentConfirmationFlag === YNOptions.Y,
        );
        if (confirmedEnrolmentDetails) {
          // Confirm enrolment.
          // Calculate tuition remittance from all enrolments which have
          // enrolment confirmation flag Y.
          const tuitionRemittance = disbursementDetails.awardDetails
            .filter((award) => award.enrolmentConfirmationFlag === YNOptions.Y)
            .map((award) => award.payToSchoolAmount)
            .reduce((accumulator, currentValue) => accumulator + currentValue);
          await this.confirmationOfEnrollmentService.confirmEnrollment(
            +disbursementScheduleId,
            auditUserId,
            tuitionRemittance,
            {
              enrolmentConfirmationDate:
                confirmedEnrolmentDetails.enrolmentConfirmationDate,
              applicationNumber: disbursementDetails.applicationNumber,
            },
          );
          ++disbursementProcessingDetails.disbursementsSuccessfullyProcessed;
          processSummary.summary.push(
            `Disbursement ${disbursementScheduleId}, enrolment confirmed.`,
          );
        } else {
          // Decline enrolment.
          await this.confirmationOfEnrollmentService.declineEnrolment(
            +disbursementScheduleId,
            auditUserId,
            {
              coeDenyReasonId: COE_DENIED_REASON_OTHER_ID,
              otherReasonDesc: ECE_RESPONSE_COE_DECLINED_REASON,
            },
            { applicationNumber: disbursementDetails.applicationNumber },
          );
          ++disbursementProcessingDetails.disbursementsSuccessfullyProcessed;
          processSummary.summary.push(
            `Disbursement ${disbursementScheduleId}, enrolment declined.`,
          );
        }
      } catch (error: unknown) {
        if (error instanceof CustomNamedError) {
          switch (error.name) {
            case ENROLMENT_NOT_FOUND:
              ++disbursementProcessingDetails.disbursementsSkipped;
              processSummary.warnings.push(
                `Disbursement ${disbursementScheduleId}, record skipped due to reason: ${error.message}`,
              );
              break;
            case ENROLMENT_ALREADY_COMPLETED:
              ++disbursementProcessingDetails.duplicateDisbursements;
              processSummary.warnings.push(
                `Disbursement ${disbursementScheduleId}, record is considered as duplicate and skipped due to reason: ${error.message}`,
              );
              break;
            case ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            case ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD:
            case FIRST_COE_NOT_COMPLETE:
            case INVALID_TUITION_REMITTANCE_AMOUNT:
            case ECE_DISBURSEMENT_DATA_NOT_VALID:
              ++disbursementProcessingDetails.disbursementsFailedToProcess;
              processSummary.warnings.push(
                `Disbursement ${disbursementScheduleId} failed to process due to an error: ${error.message}`,
              );
              break;
          }
        } else {
          processSummary.errors.push(
            `Unexpected error happened when processing disbursement ${disbursementScheduleId}. ${error}}`,
          );
        }
      }
    }
    return disbursementProcessingDetails;
  }

  /**
   * Validate disbursement data.
   * @param disbursement disbursement.
   */
  private validateDisbursement(disbursement: DisbursementDetails): void {
    const errors: string[] = [];

    const hasInvalidEnrolmentConfirmationFlag = disbursement.awardDetails.some(
      (award) =>
        !Object.values(YNOptions).includes(award.enrolmentConfirmationFlag),
    );

    if (hasInvalidEnrolmentConfirmationFlag) {
      errors.push("Invalid enrolment confirmation flag");
    }

    const confirmedEnrolments = disbursement.awardDetails.filter(
      (award) => award.enrolmentConfirmationFlag === YNOptions.Y,
    );

    // Validate the enrolment confirmation date for confirmed enrolments.
    const hasInvalidEnrolmentConfirmationDate = confirmedEnrolments.some(
      (award) => !award.enrolmentConfirmationDate,
    );

    if (hasInvalidEnrolmentConfirmationDate) {
      errors.push("Invalid enrolment confirmation date");
    }

    // Validate the pay to school amount for confirmed enrolments.
    const hasInvalidPayToSchoolAmount = confirmedEnrolments.some((award) =>
      isNaN(award.payToSchoolAmount),
    );

    if (hasInvalidPayToSchoolAmount) {
      errors.push("Invalid pay to school amount");
    }

    if (errors.length) {
      throw new CustomNamedError(
        errors.join(", ").concat("."),
        ECE_DISBURSEMENT_DATA_NOT_VALID,
      );
    }
  }

  /**
   * Create ECE Response file processing notifications.
   * @param institutionCode institution of the processing file.
   * @param disbursementProcessingDetails disbursement processing count.
   * @param processSummaryResult process summary details.
   */
  private async createECEResponseProcessingNotification(
    integrationLocation: InstitutionLocation,
    disbursementProcessingDetails: DisbursementProcessingDetails,
    processSummaryResult: ProcessSummaryResult,
  ): Promise<void> {
    try {
      // Create email notifications only if integration contacts are available.
      if (integrationLocation.integrationContacts?.length) {
        const notification: ECEResponseFileProcessingNotification = {
          institutionCode: integrationLocation.institutionCode,
          integrationContacts: integrationLocation.integrationContacts,
          fileParsingErrors: disbursementProcessingDetails.fileParsingErrors,
          totalRecords: disbursementProcessingDetails.totalRecords,
          totalRecordsSkipped:
            disbursementProcessingDetails.totalRecordsSkipped,
          totalDisbursements: disbursementProcessingDetails.totalDisbursements,
          disbursementsSuccessfullyProcessed:
            disbursementProcessingDetails.disbursementsSuccessfullyProcessed,
          disbursementsSkipped:
            disbursementProcessingDetails.disbursementsSkipped,
          duplicateDisbursements:
            disbursementProcessingDetails.duplicateDisbursements,
          disbursementsFailedToProcess:
            disbursementProcessingDetails.disbursementsFailedToProcess,
          attachmentFileContent:
            this.buildEmailAttachmentBody(processSummaryResult),
        };

        await this.notificationActionsService.saveECEResponseFileProcessingNotification(
          notification,
        );
        processSummaryResult.summary.push(
          "Notification has been created to send email to integration contacts.",
        );
      } else {
        processSummaryResult.summary.push(
          "Notification cannot be created as no integration contacts found for the institution.",
        );
      }
    } catch (error: unknown) {
      this.logger.error(error);
      processSummaryResult.errors.push(
        "Unexpected error while creating notifications.",
      );
    }
  }

  /**
   * Build the email attachment content from process summary.
   * @param processSummaryResult process summary.
   * @returns email attachment body.
   */
  private buildEmailAttachmentBody(
    processSummaryResult: ProcessSummaryResult,
  ): string {
    const attachmentBody = new StringBuilder();
    attachmentBody.appendLine("Summary:");
    attachmentBody.appendLine(processSummaryResult.summary.join(END_OF_LINE));
    const warnings = processSummaryResult.warnings.length
      ? processSummaryResult.warnings.join(END_OF_LINE)
      : "NONE";
    attachmentBody.appendLine("Warnings:");
    attachmentBody.appendLine(warnings);
    const errors = processSummaryResult.errors.length
      ? processSummaryResult.errors.join(END_OF_LINE)
      : "NONE";
    attachmentBody.appendLine("Errors:");
    attachmentBody.appendLine(errors);
    return attachmentBody.toString();
  }

  /**
   * Archive the ece response file.
   * @param remoteFilePath file path.
   * @param processSummary process summary.
   */
  private async archiveProcessedFile(
    remoteFilePath: string,
    processSummary: ProcessSummaryResult,
  ): Promise<void> {
    try {
      // Archiving the file once it has been processed.
      await this.integrationService.archiveFile(remoteFilePath);
      processSummary.summary.push(
        `The file ${remoteFilePath} has been archived after processing.`,
      );
    } catch (error: unknown) {
      const logMessage = `Error while archiving the file: ${remoteFilePath}.`;
      processSummary.errors.push(logMessage);
      processSummary.errors.push(parseJSONError(error));
      this.logger.error(logMessage, error);
    }
  }
}
