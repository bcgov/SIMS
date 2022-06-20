import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { Injectable } from "@nestjs/common";
import {
  ConfigService,
  SequenceControlService,
  SINValidationService,
  StudentService,
} from "../../services";
import { ESDCIntegrationConfig } from "../../types";
import { SINValidationIntegrationService } from "./sin-validation-integration.service";
import { SINValidation, Student } from "../../database/entities";
import { ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME } from "../../utilities";
import {
  SINCheckStatus,
  SINValidationRecord,
  SINValidationResponseResult,
  SINValidationUploadResult,
} from "./models/sin-validation-models";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import * as path from "path";
import { EntityManager } from "typeorm";

/**
 * Manages the process to generate SIN validations requests to ESDC and allow
 * the read of the responses once they are available in the SFTP.
 */
@Injectable()
export class SINValidationProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly sinValidationService: SINValidationService,
    private readonly studentService: StudentService,
    private readonly sequenceService: SequenceControlService,
    private readonly sinValidationIntegrationService: SINValidationIntegrationService,
  ) {
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns result of the upload operation.
   */
  async uploadSINValidationRequests(
    auditUserId: number,
  ): Promise<SINValidationUploadResult> {
    this.logger.log("Retrieving students with pending SIN validation...");
    const students =
      await this.studentService.getStudentsPendingSinValidation();
    if (!students.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(`Found ${students.length} student(s).`);
    const sinValidationRecords = students.map((student) => {
      return this.createSINValidationRecordFromStudent(student);
    });

    let uploadResult: SINValidationUploadResult;
    await this.sequenceService.consumeNextSequence(
      ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating SIN validation file content.");
          const fileContent =
            this.sinValidationIntegrationService.createRequestFileContent(
              sinValidationRecords,
              nextSequenceNumber,
            );

          const fileInfo =
            this.sinValidationIntegrationService.createRequestFileName(
              nextSequenceNumber,
            );

          // Updates the records in SIN Validation table for the particular user.
          // If the upload fails the rollback will be executed on DB.
          this.logger.log("Updating the records in the SIN Validation table.");
          const sinValidationRepo = entityManager.getRepository(SINValidation);
          await this.sinValidationService.updateSentRecords(
            sinValidationRecords,
            fileInfo.fileName,
            auditUserId,
            sinValidationRepo,
          );
          this.logger.log("SIN Validation table updated.");

          this.logger.log("Uploading content.");
          await this.sinValidationIntegrationService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );
          this.logger.log("Content uploaded.");

          uploadResult = {
            generatedFile: fileInfo.filePath,
            uploadedRecords: fileContent.length - 2, // Do not consider header and footer.
          };
        } catch (error) {
          this.logger.error(
            `Error while uploading content for SIN validation: ${error}`,
          );
          throw error;
        }
      },
    );

    return uploadResult;
  }

  /**
   * Creates the object wit the information expected by ESDC SIN validation.
   * @param student student that contains the data.
   * @returns ESDC SIN validation information.
   */
  private createSINValidationRecordFromStudent(
    student: Student,
  ): SINValidationRecord {
    return {
      sin: student.sinValidation.sin,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      birthDate: student.birthDate,
      sinValidationId: student.sinValidation.id,
      gender: student.gender,
    } as SINValidationRecord;
  }

  /**
   * Download all SIN validation files from ESDC response folder on SFTP and process them all.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  async processResponses(
    auditUserId: number,
  ): Promise<ProcessSFTPResponseResult[]> {
    const remoteFilePaths =
      await this.sinValidationIntegrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        new RegExp(
          `^${this.esdcConfig.environmentCode}CSLP.PBC.BC[0-9]*.IS[\w]*`,
          "i",
        ),
      );
    const processFiles: ProcessSFTPResponseResult[] = [];
    for (const remoteFilePath of remoteFilePaths) {
      processFiles.push(await this.processFile(remoteFilePath, auditUserId));
    }
    return processFiles;
  }

  /**
   * Process each individual ESDC SIN validation response file from the SFTP.
   * @param remoteFilePath ESDC SIN validation response file to be processed.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   * @returns process summary and errors summary.
   */
  private async processFile(
    remoteFilePath: string,
    auditUserId: number,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${remoteFilePath}.`);

    let responseResult: SINValidationResponseResult;

    try {
      responseResult =
        await this.sinValidationIntegrationService.downloadResponseFile(
          remoteFilePath,
        );
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return result;
    }

    result.processSummary.push(
      `File contains ${responseResult.records.length} SIN validations.`,
    );

    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    for (const sinValidationRecord of responseResult.records) {
      try {
        const hasValidSIN =
          sinValidationRecord.sinCheckStatus === SINCheckStatus.Passed;
        const updatedResult =
          await this.sinValidationService.updateSINValidationFromESDCResponse(
            sinValidationRecord,
            hasValidSIN,
            fileName,
            responseResult.header.processDate,
            auditUserId,
          );
        result.processSummary.push(
          `Processed SIN validation record from line ${sinValidationRecord.lineNumber}: ${updatedResult.operationDescription}`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${sinValidationRecord.lineNumber} from file ${fileName}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. ${error}`);
      }
    }

    try {
      await this.sinValidationIntegrationService.deleteFile(remoteFilePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting ESDC SIN validation response file: ${remoteFilePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
