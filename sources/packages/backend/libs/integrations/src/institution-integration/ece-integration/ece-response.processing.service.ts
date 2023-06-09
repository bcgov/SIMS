import { Injectable } from "@nestjs/common";
import * as path from "path";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { ProcessSummaryResult, YNOptions } from "@sims/integrations/models";
import {
  ECE_RESPONSE_COE_DECLINED_REASON,
  ECE_RESPONSE_FILE_NAME,
} from "@sims/integrations/constants";
import { InstitutionLocationService } from "@sims/integrations/services";
import {
  COE_DENIED_REASON_OTHER_ID,
  CustomNamedError,
  processInParallel,
} from "@sims/utilities";
import { ECEResponseFileDetail } from "./ece-files/ece-response-file-detail";
import {
  DisbursementDetails,
  DisbursementProcessingDetails,
  ECEDisbursements,
} from "./models/ece-integration.model";
import {
  ConfirmationOfEnrollmentService,
  SystemUsersService,
} from "@sims/services";
import {
  ECE_DISBURSEMENT_DATA_NOT_VALID,
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
  UNEXPECTED_ERROR_DOWNLOADING_FILE,
} from "@sims/services/constants";

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
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * Process all the available ECE response files in SFTP location.
   * Once the file is processed, it gets deleted.
   * @returns Process summary result.
   */
  async process(): Promise<ProcessSummaryResult[]> {
    // Get all the institution codes who are enabled for integration.
    const integrationEnabledInstitutions =
      await this.institutionLocationService.getAllIntegrationEnabledInstitutionCodes();
    const filePaths = integrationEnabledInstitutions.map((institutionCode) =>
      path.join(
        this.institutionIntegrationConfig.ftpResponseFolder,
        institutionCode,
        ECE_RESPONSE_FILE_NAME,
      ),
    );
    // Process all the files in parallel.
    const result = await processInParallel<ProcessSummaryResult, string>(
      (remoteFilePath: string) =>
        this.processDisbursementsInECEResponseFile(remoteFilePath),
      filePaths,
    );
    return result;
  }

  /**
   * Process individual ECE response file sent by institution.
   * @param remoteFilePath ECE response file path.
   * @returns process summary result.
   */
  private async processDisbursementsInECEResponseFile(
    remoteFilePath: string,
  ): Promise<ProcessSummaryResult> {
    const processSummary = new ProcessSummaryResult();
    // Setting the default value to true because, in the event of error
    // thrown from downloadResponseFile due to any data validation in the file
    // the value of isECEResponseFileExist will remain false which will be inaccurate as the file exist
    // and file deletion will not happen.
    // In the event of runtime error during downloading the file, it is handled with custom error
    // and taken care that isECEResponseFileExist is set to false when this error happens.
    let isECEResponseFileExist = true;
    processSummary.summary.push(`Starting download of file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    // Disbursement processing count.
    const disbursementProcessingDetails = new DisbursementProcessingDetails();
    try {
      const eceFileDetailRecords =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      isECEResponseFileExist = !!eceFileDetailRecords.length;
      // Check if the file exist in remote server and summary info
      // if the file is not found.
      if (!isECEResponseFileExist) {
        const warningMessage = `File ${remoteFilePath} not found.`;
        processSummary.summary.push(warningMessage);
        this.logger.log(warningMessage);
        return processSummary;
      }
      // Set the total records count.
      disbursementProcessingDetails.totalRecords = eceFileDetailRecords.length;
      // Sanitize all the ece response detail records.
      this.sanitizeDisbursements(
        eceFileDetailRecords,
        processSummary,
        disbursementProcessingDetails,
      );
      // Transform ece response detail records to disbursements which could be individually processed.
      const disbursementsToProcess =
        this.transformDetailRecordsToDisbursements(eceFileDetailRecords);
      const auditUser = await this.systemUsersService.systemUser();
      await this.validateAndUpdateEnrolmentStatus(
        disbursementsToProcess,
        auditUser.id,
        processSummary,
        disbursementProcessingDetails,
      );

      this.logger.log(`Completed processing the file ${remoteFilePath}.`);
    } catch (error: unknown) {
      // If error is thrown while downloading the file processing errors must be incremented.
      if (!disbursementProcessingDetails.fileParsingErrors) {
        ++disbursementProcessingDetails.fileParsingErrors;
      }
      this.logger.error(error);
      // In the event of runtime error during downloading the file, it is handled with custom error
      // and taken care that isECEResponseFileExist is set to false when this error happens.
      if (
        error instanceof CustomNamedError &&
        error.name === UNEXPECTED_ERROR_DOWNLOADING_FILE
      ) {
        isECEResponseFileExist = false;
      }
      processSummary.errors.push(
        `Error processing the file ${remoteFilePath}. ${error}`,
      );
      processSummary.errors.push("File processing aborted.");
    } finally {
      // Delete the ECE response file, if the file exist in remote server.
      if (isECEResponseFileExist) {
        await this.deleteProcessedFile(remoteFilePath, processSummary);
      }
    }
    // Populate the process summary count.
    processSummary.summary.push(
      `Total file parsing errors: ${disbursementProcessingDetails.fileParsingErrors}`,
    );
    processSummary.summary.push(
      `Total detail records found: ${disbursementProcessingDetails.totalRecords}`,
    );
    processSummary.summary.push(
      `Total disbursements found: ${disbursementProcessingDetails.totalDisbursements}`,
    );
    processSummary.summary.push(
      `Disbursements successfully updated: ${disbursementProcessingDetails.disbursementsSuccessfullyProcessed}`,
    );
    processSummary.summary.push(
      `Disbursements skipped to be processed: ${disbursementProcessingDetails.disbursementsSkipped}`,
    );
    processSummary.summary.push(
      `Disbursements considered duplicate and skipped: ${disbursementProcessingDetails.duplicateDisbursements}`,
    );
    processSummary.summary.push(
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
        "The file consists invalid data and cannot be processed.",
      );
    }
  }

  /**
   * Transform the detail records to individual disbursements.
   * @param eceFileDetailRecords detail records of ece file.
   * @returns disbursements to be processed.
   */
  private transformDetailRecordsToDisbursements(
    eceFileDetailRecords: ECEResponseFileDetail[],
  ): ECEDisbursements {
    const disbursements = {} as ECEDisbursements;
    for (const eceDetailRecord of eceFileDetailRecords) {
      const disbursement =
        disbursements[eceDetailRecord.disbursementIdentifier];
      if (!disbursement) {
        disbursements[eceDetailRecord.disbursementIdentifier] = {
          institutionCode: eceDetailRecord.institutionCode,
          applicationNumber: eceDetailRecord.applicationNumber,
          awardDetails: [],
        };
      }
      disbursements[eceDetailRecord.disbursementIdentifier].awardDetails.push({
        payToSchoolAmount: eceDetailRecord.payToSchoolAmount,
        enrolmentConfirmationFlag: eceDetailRecord.enrolmentConfirmationFlag,
        enrolmentConfirmationDate: eceDetailRecord.enrolmentConfirmationDate,
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
          const tuitionRemittance = disbursementDetails.awardDetails
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
              processSummary.errors.push(
                `Disbursement ${disbursementScheduleId}, record failed to process due to reason: ${error.message}`,
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
      (award) => award.enrolmentConfirmationDate.toString() === "Invalid Date",
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
   * Delete the ece response file.
   * @param remoteFilePath file path.
   * @param processSummary process summary.
   */
  private async deleteProcessedFile(
    remoteFilePath: string,
    processSummary: ProcessSummaryResult,
  ): Promise<void> {
    try {
      // Deleting the file once it has been processed.
      await this.integrationService.deleteFile(remoteFilePath);
      processSummary.summary.push(
        `The file ${remoteFilePath} has been deleted after processing.`,
      );
    } catch (error: unknown) {
      processSummary.errors.push(
        `Error while deleting the file: ${remoteFilePath}. ${error}`,
      );
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
