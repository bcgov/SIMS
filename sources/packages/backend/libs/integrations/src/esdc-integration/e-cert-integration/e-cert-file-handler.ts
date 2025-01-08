import { ProcessSummary } from "@sims/utilities/logger";
import {
  DisbursementSchedule,
  DisbursementScheduleStatus,
  OfferingIntensity,
} from "@sims/sims-db";
import {
  DisbursementScheduleErrorsService,
  ECertFeedbackErrorService,
} from "../../services";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { getISODateOnlyString, processInParallel } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import {
  Award,
  ECertRecord,
  ECertUploadResult,
} from "./models/e-cert-integration-model";
import { ECertIntegrationService } from "./e-cert.integration.service";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ECertGenerationService } from "@sims/integrations/services";
import { ECertResponseRecord } from "./e-cert-files/e-cert-response-record";
import * as path from "path";
import { CreateRequestFileNameResult } from "../models/esdc-integration.model";

/**
 * Error details: error id and block funding info
 * for each error code.
 */
interface ErrorDetails {
  id: number;
  blockFunding: boolean;
}

/**
 * ECert feedback error map with error code and
 * e-Cert feedback error details.
 */
type ECertFeedbackCodeMap = Record<string, ErrorDetails>;

export abstract class ECertFileHandler extends ESDCFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
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
   * @param processSummary cumulative process log.
   */
  abstract processECertResponses(processSummary: ProcessSummary): Promise<void>;

  /**
   * Generate the e-Cert file for Full-Time/Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @param eCertIntegrationService Full-Time/Part-Time integration responsible
   * for the respective integration.
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode file code applicable for Part-Time or Full-Time.
   * @param sequenceGroup sequence group for Part-Time or Full-Time
   * file sequence generation.
   * @param log cumulative process log.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  protected async eCertGeneration(
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    sequenceGroup: string,
    log: ProcessSummary,
  ): Promise<ECertUploadResult> {
    log.info(
      `Retrieving ${offeringIntensity} disbursements to generate the e-Cert file...`,
    );

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
  }

  /**
   * Prepare the disbursements for e-Cert generation and upload the e-Cert file.
   * @param sequenceNumber e-Cert sequence number.
   * @param entityManager manages the current DB transaction.
   * @param eCertIntegrationService Full-Time/Part-Time integration responsible
   * for the respective integration.
   * @param offeringIntensity disbursement offering intensity.
   * @param fileInfo e-Cert file information.
   * @param log cumulative process log.
   * @returns information of the uploaded e-Cert file.
   */
  private async processECert(
    sequenceNumber: number,
    entityManager: EntityManager,
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileInfo: CreateRequestFileNameResult,
    log: ProcessSummary,
  ): Promise<ECertUploadResult> {
    const disbursements =
      await this.eCertGenerationService.getReadyToSendDisbursements(
        offeringIntensity,
        entityManager,
      );
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
    await eCertIntegrationService.uploadContent(fileContent, fileInfo.filePath);
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
   * @param processSummary process summary of all files processed.
   * @param eCertIntegrationService Integration service to read and archive the files.
   * @param fileCode ECert response file code to be processed.
   * @param offeringIntensity offering intensity.
   */
  async processResponses(
    processSummary: ProcessSummary,
    eCertIntegrationService: ECertIntegrationService,
    fileCode: string,
    offeringIntensity: OfferingIntensity,
  ): Promise<void> {
    const filePaths = await eCertIntegrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      new RegExp(`^${this.esdcConfig.environmentCode}${fileCode}`, "i"),
    );
    // Return if there are no files to be processed.
    if (!filePaths.length) {
      processSummary.info(
        `There are no disbursement feedback error files to be processed for ${offeringIntensity}.`,
      );
    }
    // Get eCert feedback error map for all the error codes.
    let eCertFeedbackErrorCodeMap: ECertFeedbackCodeMap;
    try {
      eCertFeedbackErrorCodeMap = await this.getECertFeedbackErrorsMap(
        offeringIntensity,
      );
    } catch (error: unknown) {
      processSummary.error(
        "Error retrieving e-Cert feedback error map for error codes.",
        error,
      );
    }
    for (const filePath of filePaths) {
      const fileProcessingSummary = new ProcessSummary();
      processSummary.children(fileProcessingSummary);
      await this.processFile(
        fileProcessingSummary,
        eCertIntegrationService,
        filePath,
        eCertFeedbackErrorCodeMap,
      );
    }
  }

  /**
   * Process each individual E-Cert response file from the SFTP.
   * @param processSummary process summary of file processing.
   * @param eCertIntegrationService integration service.
   * @param filePath E-Cert response file to be processed.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   */
  private async processFile(
    processSummary: ProcessSummary,
    eCertIntegrationService: ECertIntegrationService,
    filePath: string,
    eCertFeedbackErrorCodeMap: ECertFeedbackCodeMap,
  ): Promise<void> {
    processSummary.info(`Processing file ${filePath}.`);
    let eCertFeedbackResponseRecords: ECertResponseRecord[];
    try {
      eCertFeedbackResponseRecords =
        await eCertIntegrationService.downloadResponseFile(filePath);
    } catch (error: unknown) {
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      processSummary.error(
        `Error downloading and parsing the file ${filePath}.`,
        error,
      );
      return;
    }
    // Processing the records.
    processSummary.info(
      `File contains ${eCertFeedbackResponseRecords.length} records.`,
    );
    try {
      const unknownErrorCodesMessage = this.getUnknownErrorCodesMessage(
        eCertFeedbackResponseRecords,
        eCertFeedbackErrorCodeMap,
      );
      if (unknownErrorCodesMessage) {
        // Abort the file processing and return after logging the unknown error codes.
        processSummary.error(unknownErrorCodesMessage);
        return;
      }
      // Get the file name from the file path.
      const feedbackFileName = path.basename(filePath);
      for (const eCertFeedbackResponseRecord of eCertFeedbackResponseRecords) {
        const recordProcessSummary = new ProcessSummary();
        processSummary.children(recordProcessSummary);
        await this.createDisbursementFeedbackError(
          recordProcessSummary,
          eCertFeedbackResponseRecord,
          eCertFeedbackErrorCodeMap,
          feedbackFileName,
        );
      }
    } catch (error: unknown) {
      // Any error caught here will abort the file processing.
      processSummary.error(`Error processing the file ${filePath}.`, error);
    } finally {
      if (!processSummary.getLogLevelSum().error) {
        await this.archiveFile(
          eCertIntegrationService,
          filePath,
          processSummary,
        );
      }
    }
  }

  /**
   * Create disbursement feedback errors for the errors received
   * in a response record and sends a ministry notification if
   * at least one of the error codes in the eCert feedback response
   * record for a disbursement blocks funding.
   * @param processSummary process summary of record processing.
   * @param eCertFeedbackResponseRecord e-Cert feedback response record.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   * @param feedbackFileName integration file name.
   *
   */
  private async createDisbursementFeedbackError(
    processSummary: ProcessSummary,
    eCertFeedbackResponseRecord: ECertResponseRecord,
    eCertFeedbackErrorCodeMap: ECertFeedbackCodeMap,
    feedbackFileName: string,
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
        .map((errorCode) => eCertFeedbackErrorCodeMap[errorCode].id);
      const blockFundingErrorCodes = [
        eCertFeedbackResponseRecord.errorCode1,
        eCertFeedbackResponseRecord.errorCode2,
        eCertFeedbackResponseRecord.errorCode3,
        eCertFeedbackResponseRecord.errorCode4,
        eCertFeedbackResponseRecord.errorCode5,
      ].filter(
        (errorCode) => eCertFeedbackErrorCodeMap[errorCode]?.blockFunding,
      );
      await this.disbursementScheduleErrorsService.createECertErrorRecord(
        eCertFeedbackResponseRecord.documentNumber,
        feedbackFileName,
        receivedErrorIds,
        dateReceived,
        blockFundingErrorCodes,
      );
      processSummary.info(
        `Disbursement feedback error created for document number ${eCertFeedbackResponseRecord.documentNumber} at line ${eCertFeedbackResponseRecord.lineNumber}.`,
      );
    } catch (error: unknown) {
      // Log the error message and continue the processing.
      const errorMessage = `Error processing the record for document number ${eCertFeedbackResponseRecord.documentNumber} at line ${eCertFeedbackResponseRecord.lineNumber}.`;
      processSummary.error(errorMessage, error);
    }
  }

  /**
   * Get eCert feedback error code map which has
   * error code as key and error id as value.
   * The map is generated for the given offering intensity.
   * @example {ERR01:1}.
   * @param offeringIntensity offering intensity.
   * @returns error code map.
   */
  private async getECertFeedbackErrorsMap(
    offeringIntensity: OfferingIntensity,
  ): Promise<ECertFeedbackCodeMap> {
    const eCertFeedbackErrors =
      await this.eCertFeedbackErrorService.getECertFeedbackErrorsByOfferingIntensity(
        offeringIntensity,
      );
    const eCertFeedbackErrorCodeMap: ECertFeedbackCodeMap = {};
    for (const eCertFeedbackError of eCertFeedbackErrors) {
      eCertFeedbackErrorCodeMap[eCertFeedbackError.errorCode] = {
        id: eCertFeedbackError.id,
        blockFunding: eCertFeedbackError.blockFunding,
      };
    }
    return eCertFeedbackErrorCodeMap;
  }

  /**
   * Validate the error codes in e-Cert response records and create unknown error code message.
   * @param eCertFeedbackResponseRecords e-Cert feedback response records to validate.
   * @param eCertFeedbackErrorCodeMap e-Cert feedback error map
   * to get error id by error code.
   * @returns unknown error code message if any unknown error codes are present.
   */
  private getUnknownErrorCodesMessage(
    eCertFeedbackResponseRecords: ECertResponseRecord[],
    eCertFeedbackErrorCodeMap: ECertFeedbackCodeMap,
  ): string | undefined {
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
      return `The following error codes are unknown to the system: ${Array.from(
        new Set(unknownFeedbackErrorCodes),
      ).join(",")}.`;
    }
  }

  /**
   * Archives the feedback file after processing.
   * @param eCertIntegrationService integration service.
   * @param filePath file path.
   * @param processSummary process summary.
   */
  private async archiveFile(
    eCertIntegrationService: ECertIntegrationService,
    filePath: string,
    processSummary: ProcessSummary,
  ) {
    try {
      await eCertIntegrationService.archiveFile(filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file archiving, it will be
      // processed again and could be archived in the second attempt.
      processSummary.error(
        `Error while archiving E-Cert response file: ${filePath}.`,
        error,
      );
    }
  }
}
