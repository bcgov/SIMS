import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { OfferingIntensity } from "@sims/sims-db";
import {
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
  ECertDisbursementSchedule,
} from "../../services";
import { SequenceControlService } from "@sims/services";
import {
  ECERT_FULL_TIME_FILE_CODE,
  ECERT_PART_TIME_FILE_CODE,
  ECERT_FULL_TIME_FEEDBACK_FILE_CODE,
  ECERT_PART_TIME_FEEDBACK_FILE_CODE,
} from "@sims/services/constants";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import {
  Award,
  ECertRecord,
  ECertUploadResult,
  ESDCFileResponse,
} from "./models/e-cert-integration-model";
import { Injectable } from "@nestjs/common";
import { ECertIntegrationService } from "./e-cert.integration.service";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time.integration.service";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time.integration.service";
import { ECertFullTimeResponseRecord } from "./e-cert-full-time-integration/e-cert-files/e-cert-response-record";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ECertGenerationService } from "@sims/integrations/services";

const ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_FT_SENT_FILE";
const ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_PT_SENT_FILE";
/**
 * Used to abort the e-Cert generation process, cancel the current transaction,
 * and let the consumer method know that it was aborted because no records are
 * present to be processed.
 */
const ECERT_GENERATION_NO_RECORDS_AVAILABLE =
  "ECERT_GENERATION_NO_RECORDS_AVAILABLE";

@Injectable()
export class ECertFileHandler extends ESDCFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly eCertGenerationService: ECertGenerationService,
    private readonly disbursementScheduleErrorsService: DisbursementScheduleErrorsService,
    private readonly eCertFullTimeIntegrationService: ECertFullTimeIntegrationService,
    private readonly eCertPartTimeIntegrationService: ECertPartTimeIntegrationService,
  ) {
    super(configService);
  }

  /**
   * Method to call the Full-time disbursements available to be sent to ESDC.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateFullTimeECert(): Promise<ECertUploadResult> {
    return this.generateECert(
      this.eCertFullTimeIntegrationService,
      OfferingIntensity.fullTime,
      ECERT_FULL_TIME_FILE_CODE,
      ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
  }

  /**
   * Method to call the Part-time disbursements available to be sent to ESDC.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generatePartTimeECert(): Promise<ECertUploadResult> {
    return this.generateECert(
      this.eCertPartTimeIntegrationService,
      OfferingIntensity.partTime,
      ECERT_PART_TIME_FILE_CODE,
      ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP,
    );
  }

  /**
   * Method to call the Full-time feedback file processing and the list of all errors, if any.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async processFullTimeResponses(): Promise<ESDCFileResponse[]> {
    return this.processResponses(
      this.eCertFullTimeIntegrationService,
      ECERT_FULL_TIME_FEEDBACK_FILE_CODE,
    );
  }

  /**
   * Method to call the Part-time feedback file processing and the list of all errors, if any.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async processPartTimeResponses(): Promise<ESDCFileResponse[]> {
    return this.processResponses(
      this.eCertPartTimeIntegrationService,
      ECERT_PART_TIME_FEEDBACK_FILE_CODE,
    );
  }

  /**
   * Generate the e-Cert file for Full-Time/Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @param eCertIntegrationService Full-Time/Part-Time integration responsible
   * for the respective integration.
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode file code applicable for Part-Time or Full-Time.
   * @param sequenceGroupPrefix sequence group prefix for Part-Time or Full-Time
   * file sequence generation.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  private async generateECert(
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    sequenceGroupPrefix: string,
  ): Promise<ECertUploadResult> {
    this.logger.log(
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
   * @returns information of the uploaded e-Cert file.
   * @throws CustomNamedError ECERT_GENERATION_NO_RECORDS_AVAILABLE
   */
  private async processECert(
    sequenceNumber: number,
    entityManager: EntityManager,
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
  ): Promise<ECertUploadResult> {
    try {
      const disbursements =
        await this.eCertGenerationService.prepareDisbursementsForECertGeneration(
          offeringIntensity,
          entityManager,
        );
      if (!disbursements.length) {
        throw new CustomNamedError(
          `There are no records available to generate an e-Cert file for ${offeringIntensity}`,
          ECERT_GENERATION_NO_RECORDS_AVAILABLE,
        );
      }
      this.logger.log(
        `Found ${disbursements.length} ${offeringIntensity} disbursements schedules.`,
      );
      const disbursementRecords = disbursements.map((disbursement) =>
        this.createECertRecord(disbursement),
      );

      this.logger.log(`Creating  ${offeringIntensity} e-Cert file content...`);
      const fileContent = eCertIntegrationService.createRequestContent(
        disbursementRecords,
        sequenceNumber,
      );

      // Create the request filename with the file path for the e-Cert File.
      const fileInfo = this.createRequestFileName(fileCode, sequenceNumber);
      this.logger.log(`Uploading ${offeringIntensity} content...`);
      await eCertIntegrationService.uploadContent(
        fileContent,
        fileInfo.filePath,
      );
      return {
        generatedFile: fileInfo.filePath,
        uploadedRecords: disbursementRecords.length,
      };
    } catch (error: unknown) {
      if (
        error instanceof CustomNamedError &&
        error.name !== ECERT_GENERATION_NO_RECORDS_AVAILABLE
      ) {
        this.logger.error(
          `Error while uploading content for ${offeringIntensity} e-Cert file: ${error}`,
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
  createECertRecord(disbursement: ECertDisbursementSchedule): ECertRecord {
    const now = new Date();
    const application = disbursement.studentAssessment.application;
    const student = application.student;
    const addressInfo = application.student.contactInfo.address;
    const offering = application.currentAssessment.offering;

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
      stopFullTimeBCFunding: disbursement.stopFullTimeBCFunding,
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
      weeksOfStudy: application.currentAssessment.assessmentData.weeks,
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
      // TODO: getting the information directly from the student profile since there is no
      // direction from the business at this moment from where it should actually come.
      ppdFlag: student.studentPDVerified,
      maritalStatus: application.relationshipStatus,
      studentNumber: application.studentNumber,
      awards,
    } as ECertRecord;
  }

  /**
   * Download all files from E-Cert Response folder on SFTP and process them all.
   * @param eCertIntegrationService
   * @param fileCode ECert response file code to be processed.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(
    eCertIntegrationService: ECertIntegrationService,
    fileCode: string,
  ): Promise<ProcessSFTPResponseResult[]> {
    const filePaths = await eCertIntegrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      new RegExp(`^${this.esdcConfig.environmentCode}${fileCode}`, "i"),
    );
    const processFiles: ProcessSFTPResponseResult[] = [];
    for (const filePath of filePaths) {
      processFiles.push(
        await this.processFile(eCertIntegrationService, filePath),
      );
    }
    return processFiles;
  }

  /**
   * Process each individual E-Cert response file from the SFTP.
   * @param eCertIntegrationService
   * @param filePath E-Cert response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    eCertIntegrationService: ECertIntegrationService,
    filePath: string,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${filePath}.`);

    let responseFile: ECertFullTimeResponseRecord[];

    try {
      responseFile = await eCertIntegrationService.downloadResponseFile(
        filePath,
      );
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(`Error downloading file ${filePath}. ${error}`);
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return result;
    }

    result.processSummary.push(`File contains ${responseFile.length} records.`);

    for (const feedbackRecord of responseFile) {
      try {
        await this.processErrorCodeRecords(feedbackRecord);
        this.logger.log(
          `Successfully processed line ${feedbackRecord.lineNumber}.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${feedbackRecord.lineNumber} from file ${filePath}, error: ${error}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      if (result.errorsSummary.length === 0) {
        // if there is an error in the file do not delete the file
        await eCertIntegrationService.deleteFile(filePath);
      }
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting E-Cert response file: ${filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  /**
   * Process the feedback record from the E-Cert response file
   * and save the error code and disbursementSchedule_id respective to
   * the document number in DisbursementFeedbackErrors.
   * @param feedbackRecord E-Cert received record
   */
  private async processErrorCodeRecords(
    feedbackRecord: ECertFullTimeResponseRecord,
  ): Promise<void> {
    const disbursementSchedule =
      await this.disbursementScheduleService.getDisbursementScheduleByDocumentNumber(
        feedbackRecord.documentNumber,
      );
    if (disbursementSchedule) {
      await this.disbursementScheduleErrorsService.createECertErrorRecord(
        disbursementSchedule,
        [
          feedbackRecord.errorCode1,
          feedbackRecord.errorCode2,
          feedbackRecord.errorCode3,
          feedbackRecord.errorCode4,
          feedbackRecord.errorCode5,
        ].filter((error) => error),
        new Date(),
      );
    } else {
      throw new Error(
        `${feedbackRecord.documentNumber} document number not found in disbursement_schedule table.`,
      );
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
