import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
  ECertFeedbackErrorService,
} from "../../services";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import {
  CustomNamedError,
  getISODateOnlyString,
  parseJSONError,
  processInParallel,
} from "@sims/utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import {
  Award,
  ECertRecord,
  ECertUploadResult,
  ESDCFileResponse,
} from "./models/e-cert-integration-model";
import { ECertIntegrationService } from "./e-cert.integration.service";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ECertGenerationService } from "@sims/integrations/services";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";

/**
 * Used to abort the e-Cert generation process, cancel the current transaction,
 * and let the consumer method know that it was aborted because no records are
 * present to be processed.
 */
const ECERT_GENERATION_NO_RECORDS_AVAILABLE =
  "ECERT_GENERATION_NO_RECORDS_AVAILABLE";

export abstract class ECertFileHandler extends ESDCFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
    private readonly systemUserService: SystemUsersService,
    private readonly eCertFeedbackErrorService: ECertFeedbackErrorService,
  ) {
    super(configService);
  }

  /**
   * Method to send the e-Cert disbursements available to ESDC.
   * @param log cumulative process log.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  abstract generateECert(log: ProcessSummary): Promise<ECertUploadResult>;

  /**
   * Method to call the e-cert feedback file processing and the list of all errors, if any.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  abstract processECertResponses(): Promise<ESDCFileResponse[]>;

  /**
   * Generate the e-Cert file for Full-Time/Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @param eCertIntegrationService Full-Time/Part-Time integration responsible
   * for the respective integration.
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode file code applicable for Part-Time or Full-Time.
   * @param sequenceGroupPrefix sequence group prefix for Part-Time or Full-Time
   * file sequence generation.
   * @param log cumulative process log.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  protected async eCertGeneration(
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    sequenceGroupPrefix: string,
    log: ProcessSummary,
  ): Promise<ECertUploadResult> {
    log.info(
      `Retrieving ${offeringIntensity} disbursements to generate the e-Cert file...`,
    );
    try {
      const sequenceGroup = `${sequenceGroupPrefix}_${getISODateOnlyString(
        new Date(),
      )}`;
      let uploadResult: ECertUploadResult;
      await this.sequenceService.consumeNextSequence(
        sequenceGroup,
        async (nextSequenceNumber: number, entityManager: EntityManager) => {
          uploadResult = await this.processECert(
            nextSequenceNumber,
            entityManager,
            eCertIntegrationService,
            offeringIntensity,
            fileCode,
            log,
          );
        },
      );
      return uploadResult;
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name === ECERT_GENERATION_NO_RECORDS_AVAILABLE
      ) {
        return {
          generatedFile: "none",
          uploadedRecords: 0,
        };
      }
      throw error;
    }
  }

  /**
   * Prepare the disbursements for e-Cert generation and upload the e-Cert file.
   * @param sequenceNumber e-Cert sequence number.
   * @param entityManager manages the current DB transaction.
   * @param eCertIntegrationService Full-Time/Part-Time integration responsible
   * for the respective integration.
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode file code applicable for Part-Time or Full-Time.
   * @param log cumulative process log.
   * @returns information of the uploaded e-Cert file.
   * @throws CustomNamedError ECERT_GENERATION_NO_RECORDS_AVAILABLE
   */
  private async processECert(
    sequenceNumber: number,
    entityManager: EntityManager,
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    log: ProcessSummary,
  ): Promise<ECertUploadResult> {
    try {
      const disbursements =
        await this.eCertGenerationService.getReadyToSendDisbursements(
          offeringIntensity,
          entityManager,
        );
      if (!disbursements.length) {
        // Throws an exception to cancel the transaction and DB lock started by `consumeNextSequence`.
        throw new CustomNamedError(
          `There are no records available to generate an e-Cert file for ${offeringIntensity}`,
          ECERT_GENERATION_NO_RECORDS_AVAILABLE,
        );
      }
      log.info(
        `Found ${disbursements.length} ${offeringIntensity} disbursements schedules.`,
      );
      const disbursementRecords = disbursements.map((disbursement) =>
        this.createECertRecord(disbursement),
      );

      log.info(`Creating ${offeringIntensity} e-Cert file content...`);
      const fileContent = eCertIntegrationService.createRequestContent(
        disbursementRecords,
        sequenceNumber,
      );

      // Create the request filename with the file path for the e-Cert File.
      const fileInfo = this.createRequestFileName(fileCode, sequenceNumber);
      log.info(`Uploading ${offeringIntensity} content...`);
      await eCertIntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      // Mark all disbursements as sent.
      const dateSent = new Date();
      const disbursementScheduleRepo =
        entityManager.getRepository(DisbursementSchedule);
      await processInParallel((disbursement) => {
        return disbursementScheduleRepo.update(
          { id: disbursement.id },
          {
            dateSent,
            disbursementScheduleStatus: DisbursementScheduleStatus.Sent,
            updatedAt: dateSent,
            modifier: this.systemUserService.systemUser,
          },
        );
      }, disbursements);
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: disbursementRecords.length,
      };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name !== ECERT_GENERATION_NO_RECORDS_AVAILABLE
      ) {
        log.error(
          `Error while uploading content for ${offeringIntensity} e-Cert file: ${parseJSONError(
            error,
          )}`,
        );
      }
      throw error;
    }
  }

  /**
   * Create the e-Cert record with the information needed to generate the
   * entire record to be sent to ESDC.
   * @param disbursement disbursement that contains all information to
   * generate the record.
   * @returns e-Cert record.
   */
  private createECertRecord(disbursement: DisbursementSchedule): ECertRecord {
    const now = new Date();
    const application = disbursement.studentAssessment.application;
    const student = application.student;
    const addressInfo = student.contactInfo.address;
    const offering = disbursement.studentAssessment.offering;

    const awards = disbursement.disbursementValues.map(
      (disbursementValue) =>
        ({
          valueType: disbursementValue.valueType,
          valueCode: disbursementValue.valueCode,
          valueAmount: disbursementValue.valueAmount,
          effectiveAmount: disbursementValue.effectiveAmount,
        } as Award),
    );

    return {
      sin: student.sinValidation.sin,
      courseLoad: offering.courseLoad,
      applicationNumber: application.applicationNumber,
      documentNumber: disbursement.documentNumber,
      disbursementDate: new Date(disbursement.disbursementDate),
      documentProducedDate: now,
      negotiatedExpiryDate: new Date(disbursement.negotiatedExpiryDate),
      schoolAmount: disbursement.tuitionRemittanceEffectiveAmount,
      educationalStartDate: new Date(offering.studyStartDate),
      educationalEndDate: new Date(offering.studyEndDate),
      federalInstitutionCode: offering.institutionLocation.institutionCode,
      weeksOfStudy: disbursement.studentAssessment.assessmentData.weeks,
      fieldOfStudy: offering.educationProgram.fieldOfStudyCode,
      yearOfStudy: offering.yearOfStudy,
      completionYears: offering.educationProgram.completionYears,
      enrollmentConfirmationDate: disbursement.coeUpdatedAt,
      dateOfBirth: new Date(student.birthDate),
      lastName: student.user.lastName,
      firstName: student.user.firstName,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      country: addressInfo.country,
      provinceState: addressInfo.provinceState,
      postalCode: addressInfo.postalCode,
      email: student.user.email,
      gender: student.gender,
      maritalStatus: application.relationshipStatus,
      studentNumber: application.studentNumber,
      awards,
      calculatedPDPPDStatus:
        disbursement.studentAssessment.workflowData.calculatedData.pdppdStatus,
    } as ECertRecord;
  }

  /**
   * Download all files from E-Cert Response folder on SFTP and process them all.
   * @param eCertIntegrationService
   * @param fileCode ECert response file code to be processed.
   * @param offeringIntensity offering intensity.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(
    eCertIntegrationService: ECertIntegrationService,
    fileCode: string,
    offeringIntensity: OfferingIntensity,
  ): Promise<ProcessSFTPResponseResult[]> {
    const filePaths = await eCertIntegrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      new RegExp(`^${this.esdcConfig.environmentCode}${fileCode}`, "i"),
    );
    const processResults: ProcessSFTPResponseResult[] = [];
    // Return if there are no files to be processed.
    if (!filePaths.length) {
      const processResult = new ProcessSFTPResponseResult();
      processResult.processSummary.push(
        `There are no disbursement feedback error files to be processed for ${offeringIntensity}`,
      );
      processResults.push(processResult);
      return processResults;
    }
    const eCertFeedbackErrorCodeMap = await this.getECertFeedbackErrorsMap(
      offeringIntensity,
    );
    for (const filePath of filePaths) {
      processResults.push(
        await this.processFile(
          eCertIntegrationService,
          filePath,
          eCertFeedbackErrorCodeMap,
        ),
      );
    }
    return processResults;
  }

  /**
   * Process each individual E-Cert response file from the SFTP.
   * @param eCertIntegrationService
   * @param filePath E-Cert response file to be processed.
   * @param offeringIntensity offering intensity.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    eCertIntegrationService: ECertIntegrationService,
    filePath: string,
    eCertFeedbackErrorCodeMap: Record<string, number>,
  ): Promise<ProcessSFTPResponseResult> {
    const processResult = new ProcessSFTPResponseResult();
    processResult.processSummary.push(`Processing file ${filePath}.`);

    let eCertFeedbackResponseRecords: ECertResponseRecord[];

    try {
      eCertFeedbackResponseRecords =
        await eCertIntegrationService.downloadResponseFile(filePath);
    } catch (error) {
      this.logger.error(error);
      processResult.errorsSummary.push(
        `Error downloading file ${filePath}. ${error}`,
      );
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return processResult;
    }
    // Processing the records.
    processResult.processSummary.push(
      `File contains ${eCertFeedbackResponseRecords.length} records.`,
    );
    try {
      this.sanitizeErrorCodes(
        eCertFeedbackResponseRecords,
        eCertFeedbackErrorCodeMap,
      );
      for (const eCertFeedbackResponseRecord of eCertFeedbackResponseRecords) {
        await this.createDisbursementFeedbackError(
          eCertFeedbackResponseRecord,
          eCertFeedbackErrorCodeMap,
          processResult,
        );
      }
    } catch (error: unknown) {
      // Any error caught here will abort the file processing.
      const errorDescription = `Error processing the file ${filePath}. Error: ${error}`;
      this.logger.error(errorDescription);
      processResult.errorsSummary.push(errorDescription);
      return processResult;
    } finally {
      if (!processResult.errorsSummary.length) {
        await this.deleteFile(eCertIntegrationService, filePath, processResult);
      }
    }
    return processResult;
  }

  /**
   * Create disbursement feedback errors
   * for the errors received in a response record.
   * @param eCertFeedbackResponseRecord e-Cert feedback response record.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   * @param filePath file path.
   * @param processResult processing result.
   */
  private async createDisbursementFeedbackError(
    eCertFeedbackResponseRecord: ECertResponseRecord,
    eCertFeedbackErrorCodeMap: Record<string, number>,
    processResult: ProcessSFTPResponseResult,
  ): Promise<void> {
    try {
      const dateReceived = new Date();
      const receivedErrorIds = [
        eCertFeedbackResponseRecord.errorCode1,
        eCertFeedbackResponseRecord.errorCode2,
        eCertFeedbackResponseRecord.errorCode3,
        eCertFeedbackResponseRecord.errorCode4,
        eCertFeedbackResponseRecord.errorCode5,
      ]
        .filter((errorCode) => errorCode)
        .map((errorCode) => eCertFeedbackErrorCodeMap[errorCode]);

      await this.disbursementScheduleErrorsService.createECertErrorRecord(
        eCertFeedbackResponseRecord.documentNumber,
        receivedErrorIds,
        dateReceived,
      );
      const logMessage = `Disbursement feedback error created for document number ${eCertFeedbackResponseRecord.documentNumber} at line ${eCertFeedbackResponseRecord.lineNumber}.`;
      this.logger.log(logMessage);
      processResult.processSummary.push(logMessage);
    } catch (error: unknown) {
      // Log the error message and continue the processing.
      const errorDescription = `Error processing the record for document number ${eCertFeedbackResponseRecord.documentNumber} at line ${eCertFeedbackResponseRecord.lineNumber}. Error: ${error}`;
      this.logger.error(errorDescription);
      processResult.errorsSummary.push(errorDescription);
    }
  }

  /**
   * Get eCert feedback error map which has
   * error code as key and error id as value.
   * The map is generated for the given offering intensity.
   * @example {ERR01:1}.
   * @param offeringIntensity offering intensity.
   */
  private async getECertFeedbackErrorsMap(
    offeringIntensity: OfferingIntensity,
  ): Promise<Record<string, number>> {
    const eCertFeedbackErrors =
      await this.eCertFeedbackErrorService.getECertFeedbackErrorsByOfferingIntensity(
        offeringIntensity,
      );
    const eCertFeedbackErrorCodeMap: Record<string, number> = {};
    for (const eCertFeedbackError of eCertFeedbackErrors) {
      eCertFeedbackErrorCodeMap[eCertFeedbackError.errorCode] =
        eCertFeedbackError.id;
    }
    return eCertFeedbackErrorCodeMap;
  }

  /**
   * Sanitize the e-Cert response records validating the error codes.
   * @param eCertFeedbackResponseRecords e-Cert feedback response records to sanitize.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   */
  private sanitizeErrorCodes(
    eCertFeedbackResponseRecords: ECertResponseRecord[],
    eCertFeedbackErrorCodeMap: Record<string, number>,
  ): void {
    // Check for error codes sent that are not known to the system.
    // In the case the system needs to be updated with latest error codes.
    const unknownFeedbackErrorCodes: string[] =
      eCertFeedbackResponseRecords.flatMap((eCertFeedbackResponseRecord) =>
        [
          eCertFeedbackResponseRecord.errorCode1,
          eCertFeedbackResponseRecord.errorCode2,
          eCertFeedbackResponseRecord.errorCode3,
          eCertFeedbackResponseRecord.errorCode4,
          eCertFeedbackResponseRecord.errorCode5,
        ].filter(
          (errorCode) => errorCode && !eCertFeedbackErrorCodeMap[errorCode],
        ),
      );
    if (unknownFeedbackErrorCodes.length) {
      throw new Error(
        `The following error codes are unknown to the system. ${Array.from(
          new Set(unknownFeedbackErrorCodes),
        ).join(",")}`,
      );
    }
  }

  /**
   * Delete the feedback file after processing.
   * @param eCertIntegrationService integration service.
   * @param filePath file path.
   * @param processResult processing result.
   */
  private async deleteFile(
    eCertIntegrationService: ECertIntegrationService,
    filePath: string,
    processResult: ProcessSFTPResponseResult,
  ) {
    try {
      await eCertIntegrationService.deleteFile(filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting E-Cert response file: ${filePath}`;
      this.logger.error(logMessage);
      processResult.errorsSummary.push(logMessage);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
