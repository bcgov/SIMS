import { InjectLogger } from "../../common";
import {
  DisbursementSchedule,
  OfferingIntensity,
} from "../../database/entities";
import { LoggerService } from "../../logger/logger.service";
import {
  ConfigService,
  DisbursementScheduleErrorsService,
  DisbursementScheduleService,
  SequenceControlService,
} from "../../services";
import {
  ECERT_FULL_TIME_FILE_CODE,
  ECERT_PART_TIME_FILE_CODE,
  ECERT_FULL_TIME_FEEDBACK_FILE_CODE,
  ECERT_PART_TIME_FEEDBACK_FILE_CODE,
  getDayOfTheYear,
  getFieldOfStudyFromCIPCode,
  getISODateOnlyString,
} from "../../utilities";
import { EntityManager } from "typeorm";
import { ESDCFileHandler } from "../esdc-file-handler";
import {
  Award,
  ECertRecord,
  ECertUploadResult,
} from "./models/e-cert-integration-model";
import { Injectable } from "@nestjs/common";
import { ECertIntegrationService } from "./e-cert-integration.service";
import { ECertFullTimeIntegrationService } from "./e-cert-full-time-integration/e-cert-full-time-integration.service";
import { ECertPartTimeIntegrationService } from "./e-cert-part-time-integration/e-cert-part-time-integration.service";
import { ECertFullTimeResponseRecord } from "./e-cert-full-time-integration/e-cert-files/e-cert-response-record";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { ESDCIntegrationConfig } from "../../types";
import { ESDCFileResponseDTO } from "../../route-controllers/esdc-integration/models/esdc-model";

const ECERT_FULL_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_FT_SENT_FILE";
const ECERT_PART_TIME_SENT_FILE_SEQUENCE_GROUP = "ECERT_PT_SENT_FILE";
@Injectable()
export class ECertFileHandler extends ESDCFileHandler {
  esdcConfig: ESDCIntegrationConfig;
  constructor(
    configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly disbursementScheduleService: DisbursementScheduleService,
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
  async processFullTimeResponses(): Promise<ESDCFileResponseDTO[]> {
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
  async processPartTimeResponses(): Promise<ESDCFileResponseDTO[]> {
    return this.processResponses(
      this.eCertPartTimeIntegrationService,
      ECERT_PART_TIME_FEEDBACK_FILE_CODE,
    );
  }

  /**
   * Get all Full-Time/ Part-Time disbursements available to be sent to ESDC.
   * Consider any record that is scheduled in upcoming days or in the past.
   * @param eCertIntegrationService
   * @param offeringIntensity disbursement offering intensity.
   * @param fileCode File code applicable for Part-Time or Full-Time.
   * @param sequenceGroup Sequence group application for Part-Time or Full-Time.
   * @returns result of the file upload with the file generated and the
   * amount of records added to the file.
   */
  async generateECert(
    eCertIntegrationService: ECertIntegrationService,
    offeringIntensity: OfferingIntensity,
    fileCode: string,
    sequenceGroup: string,
  ): Promise<ECertUploadResult> {
    this.logger.log(
      `Retrieving ${offeringIntensity} disbursements to generate the e-Cert file...`,
    );
    const disbursements =
      await this.disbursementScheduleService.getECertInformationToBeSent(
        offeringIntensity,
      );
    if (!disbursements.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }
    this.logger.log(
      `Found ${disbursements.length} ${offeringIntensity} disbursements schedules.`,
    );
    const disbursementRecords = disbursements.map((disbursement) => {
      return this.createECertRecord(disbursement);
    });

    // Fetches the disbursements ids, for further update in the DB.
    const disbursementIds = disbursements.map(
      (disbursement) => disbursement.id,
    );

    //Create records and create the unique file sequence number.
    let uploadResult: ECertUploadResult;
    const now = new Date();
    const dayOfTheYear = getDayOfTheYear(now);
    await this.sequenceService.consumeNextSequence(
      `${sequenceGroup}_${getISODateOnlyString(new Date())}`,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log(
            `Creating  ${offeringIntensity} e-Cert file content...`,
          );
          const fileContent = eCertIntegrationService.createRequestContent(
            disbursementRecords,
            nextSequenceNumber,
          );

          // Create the request filename with the file path for the e-Cert File.
          const fileInfo = await this.createRequestFileName(
            `${fileCode}${now.getFullYear()}${dayOfTheYear}`,
            nextSequenceNumber,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const disbursementScheduleRepo =
            entityManager.getRepository(DisbursementSchedule);
          await this.disbursementScheduleService.updateRecordsInSentFile(
            disbursementIds,
            now,
            disbursementScheduleRepo,
          );

          this.logger.log(`Uploading ${offeringIntensity} content...`);
          await eCertIntegrationService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          uploadResult = {
            generatedFile: fileInfo.filePath,
            uploadedRecords: disbursementRecords.length,
          };
        } catch (error) {
          this.logger.error(
            `Error while uploading content for ${offeringIntensity} e-Cert file: ${error}`,
          );
          throw error;
        }
      },
    );
    return uploadResult;
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
    const [addressInfo] = application.student.contactInfo.addresses;
    const fieldOfStudy = getFieldOfStudyFromCIPCode(
      application.currentAssessment.offering.educationProgram.cipCode,
    );
    const awards = disbursement.disbursementValues.map(
      (disbursementValue) =>
        ({
          valueType: disbursementValue.valueType,
          valueCode: disbursementValue.valueCode,
          valueAmount: disbursementValue.valueAmount,
        } as Award),
    );

    return {
      sin: application.student.sin,
      courseLoad: 50, // TODO change this value when we are updating the workflow course load.
      applicationNumber: application.applicationNumber,
      documentNumber: disbursement.documentNumber,
      disbursementDate: disbursement.disbursementDate,
      documentProducedDate: now,
      negotiatedExpiryDate: disbursement.negotiatedExpiryDate,
      schoolAmount:
        application.currentAssessment.offering.tuitionRemittanceRequestedAmount,
      educationalStartDate:
        application.currentAssessment.offering.studyStartDate,
      educationalEndDate: application.currentAssessment.offering.studyEndDate,
      federalInstitutionCode: application.location.institutionCode,
      weeksOfStudy: application.currentAssessment.assessmentData.weeks,
      fieldOfStudy,
      yearOfStudy: application.currentAssessment.offering.yearOfStudy,
      completionYears:
        application.currentAssessment.offering.educationProgram.completionYears,
      enrollmentConfirmationDate: disbursement.coeUpdatedAt,
      dateOfBirth: application.student.birthDate,
      lastName: application.student.user.lastName,
      firstName: application.student.user.firstName,
      addressLine1: addressInfo.addressLine1,
      addressLine2: addressInfo.addressLine2,
      city: addressInfo.city,
      country: addressInfo.country,
      email: application.student.user.email,
      gender: application.student.gender,
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
