import { Injectable } from "@nestjs/common";
import * as path from "path";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { ProcessSummaryResult } from "@sims/integrations/models";
import { ECE_RESPONSE_FILE_NAME } from "@sims/integrations/constants";
import { InstitutionLocationService } from "@sims/integrations/services";
import {
  COE_DENIED_REASON_OTHER_ID,
  CustomNamedError,
  processInParallel,
} from "@sims/utilities";
import { ECEResponseFileDetail } from "./ece-files/ece-response-file-detail";
import { ECEDisbursements } from "./models/ece-integration.model";
import {
  ConfirmationOfEnrollmentService,
  SystemUsersService,
} from "@sims/services";
import {
  ENROLMENT_ALREADY_COMPLETED,
  ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD,
  ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE,
  ENROLMENT_NOT_FOUND,
  FIRST_COE_NOT_COMPLETE,
  INVALID_TUITION_REMITTANCE_AMOUNT,
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
   * @returns Process summary.
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
   * @param remoteFilePath ECE response file path
   * @returns process summary result.
   */
  private async processDisbursementsInECEResponseFile(
    remoteFilePath: string,
  ): Promise<ProcessSummaryResult> {
    const processSummary: ProcessSummaryResult = new ProcessSummaryResult();
    processSummary.summary.push(`Reading file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    try {
      const eceFileDetailRecords =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      if (!eceFileDetailRecords.length) {
        processSummary.summary.push(`File ${remoteFilePath} not found.`);
        return processSummary;
      }
      const disbursementsToProcess =
        this.sanitizeAndTransformToDisbursements(eceFileDetailRecords);
      const auditUser = await this.systemUsersService.systemUser();
      await this.validateAndUpdateEnrolmentStatus(
        disbursementsToProcess,
        auditUser.id,
        processSummary,
      );
    } catch (error: unknown) {
      this.logger.error(error);
      processSummary.errors.push(
        `Error downloading file ${remoteFilePath}. ${error}`,
      );
    }
    return processSummary;
  }

  private sanitizeAndTransformToDisbursements(
    eceFileDetailRecords: ECEResponseFileDetail[],
  ): ECEDisbursements {
    const disbursements = {} as ECEDisbursements;
    for (const eceDetailRecord of eceFileDetailRecords) {
      const errorMessage = eceDetailRecord.getInvalidDataMessage();
      if (errorMessage) {
        throw new Error(
          `${errorMessage} at line ${eceDetailRecord.lineNumber}`,
        );
      }
      const disbursement =
        disbursements[eceDetailRecord.disbursementIdentifier];
      if (!disbursement) {
        disbursements[eceDetailRecord.disbursementIdentifier] = {
          institutionCode: eceDetailRecord.institutionCode,
          applicationNumber: eceDetailRecord.applicationNumber,
          awardDetails: [
            {
              payToSchoolAmount: eceDetailRecord.payToSchoolAmount,
              isEnrolmentConfirmed: eceDetailRecord.isEnrolmentConfirmed,
              enrolmentConfirmationDate:
                eceDetailRecord.enrolmentConfirmationDate,
            },
          ],
        };
      } else {
        const awardDetails =
          disbursements[eceDetailRecord.disbursementIdentifier]["awardDetails"];
        awardDetails.push({
          payToSchoolAmount: eceDetailRecord.payToSchoolAmount,
          isEnrolmentConfirmed: eceDetailRecord.isEnrolmentConfirmed,
          enrolmentConfirmationDate: eceDetailRecord.enrolmentConfirmationDate,
        });
      }
    }
    return disbursements;
  }

  /**
   * Validate the disbursement and application and
   * update the enrolment status.
   * @param disbursements disbursements to be processed,
   * @param auditUser user who confirm or decline the enrolment.
   * @param processSummary process summary.
   */
  private async validateAndUpdateEnrolmentStatus(
    disbursements: ECEDisbursements,
    auditUserId: number,
    processSummary: ProcessSummaryResult,
  ) {
    for (const [disbursementScheduleId, disbursementDetails] of Object.entries(
      disbursements,
    )) {
      const confirmedEnrolmentDetails = disbursementDetails.awardDetails.find(
        (awardDetail) => awardDetail.isEnrolmentConfirmed,
      );
      try {
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
            },
          );
          processSummary.summary.push(
            `For disbursement ${disbursementScheduleId}, enrolment has been confirmed.`,
          );
        } else {
          // Decline enrolment.
          await this.confirmationOfEnrollmentService.declineEnrolment(
            +disbursementScheduleId,
            auditUserId,
            {
              coeDenyReasonId: COE_DENIED_REASON_OTHER_ID,
              otherReasonDesc: "Other",
            },
            { applicationNumber: disbursementDetails.applicationNumber },
          );
          processSummary.summary.push(
            `For disbursement ${disbursementScheduleId}, enrolment has been declined.`,
          );
        }
      } catch (error: unknown) {
        if (error instanceof CustomNamedError) {
          switch (error.name) {
            case ENROLMENT_NOT_FOUND:
            case ENROLMENT_ALREADY_COMPLETED:
              processSummary.warnings.push(
                `For disbursement ${disbursementScheduleId}, record skipped due to reason: ${error.message}`,
              );
              break;
            case ENROLMENT_INVALID_OPERATION_IN_THE_CURRENT_STATE:
            case ENROLMENT_CONFIRMATION_DATE_NOT_WITHIN_APPROVAL_PERIOD:
            case FIRST_COE_NOT_COMPLETE:
            case INVALID_TUITION_REMITTANCE_AMOUNT:
              processSummary.errors.push(
                `For disbursement ${disbursementScheduleId}, record failed to process due to reason: ${error.message}`,
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
  }

  @InjectLogger()
  logger: LoggerService;
}
