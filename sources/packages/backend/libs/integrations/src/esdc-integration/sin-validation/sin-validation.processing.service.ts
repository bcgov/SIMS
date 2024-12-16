import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { SequenceControlService, SystemUsersService } from "@sims/services";
import { SINValidationIntegrationService } from "./sin-validation.integration.service";
import { SINValidation, Student } from "@sims/sims-db";
import {
  SINValidationRecord,
  SINValidationResponseResult,
  SINValidationUploadResult,
} from "./models/sin-validation-models";
import * as path from "path";
import { EntityManager } from "typeorm";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME } from "@sims/services/constants";
import {
  SINValidationService,
  StudentService,
} from "@sims/integrations/services";

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
    private readonly systemUsersService: SystemUsersService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for ESDC processing.
   * @param processSummary process summary for logging.
   * @returns result of the upload operation.
   */
  async uploadSINValidationRequests(
    processSummary: ProcessSummary,
  ): Promise<SINValidationUploadResult> {
    const auditUser = this.systemUsersService.systemUser;
    processSummary.info("Retrieving students with pending SIN validation...");
    const students =
      await this.studentService.getStudentsPendingSinValidation();
    if (!students.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    processSummary.info(`Found ${students.length} student(s).`);
    const sinValidationRecords = students.map((student) => {
      return this.createSINValidationRecordFromStudent(student);
    });

    let uploadResult: SINValidationUploadResult;
    await this.sequenceService.consumeNextSequence(
      ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME,
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          processSummary.info("Creating SIN validation file content.");
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
          processSummary.info(
            "Updating the records in the SIN Validation table.",
          );
          const sinValidationRepo = entityManager.getRepository(SINValidation);
          await this.sinValidationService.updateSentRecords(
            sinValidationRecords,
            fileInfo.fileName,
            auditUser.id,
            sinValidationRepo,
          );
          processSummary.info("SIN Validation table updated.");
          processSummary.info("Uploading content.");
          await this.sinValidationIntegrationService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );
          processSummary.info("Content uploaded.");
          uploadResult = {
            generatedFile: fileInfo.filePath,
            uploadedRecords: fileContent.length - 2, // Do not consider header and footer.
          };
        } catch (error: unknown) {
          const errorMessage =
            "Error while uploading content for SIN validation.";
          this.logger.error(errorMessage, error);
          throw new Error(errorMessage, error);
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
   * @param processSummary process summary for logging.
   * @returns summary with what was processed and the list of all errors, if any.
   */
  async processResponses(processSummary: ProcessSummary): Promise<void> {
    const remoteFilePaths =
      await this.sinValidationIntegrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        new RegExp(
          `^${this.esdcConfig.environmentCode}CSLP.PBC.BC[0-9]*.IS[\w]*`,
          "i",
        ),
      );
    for (const remoteFilePath of remoteFilePaths) {
      const childProcessSummary = new ProcessSummary();
      processSummary.children(childProcessSummary);
      await this.processFile(remoteFilePath, childProcessSummary);
    }
  }

  /**
   * Process each individual ESDC SIN validation response file from the SFTP.
   * @param remoteFilePath ESDC SIN validation response file to be processed.
   * @param processSummary process summary for logging.
   * @returns process summary and errors summary.
   */
  private async processFile(
    remoteFilePath: string,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file ${remoteFilePath}.`);
    let responseResult: SINValidationResponseResult;
    try {
      responseResult =
        await this.sinValidationIntegrationService.downloadResponseFile(
          remoteFilePath,
        );
    } catch (error: unknown) {
      const errorMessage = `Error downloading file ${remoteFilePath}.`;
      this.logger.error(errorMessage, error);
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      processSummary.error(errorMessage, error);
      return;
    }
    // File downloaded successfully.
    processSummary.info(
      `File contains ${responseResult.records.length} SIN validations.`,
    );
    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    for (const sinValidationRecord of responseResult.records) {
      try {
        const updatedResult =
          await this.sinValidationService.updateSINValidationFromESDCResponse(
            sinValidationRecord,
            fileName,
            responseResult.header.processDate,
            this.systemUsersService.systemUser.id,
          );
        processSummary.info(
          `Processed SIN validation record from line ${sinValidationRecord.lineNumber}: ${updatedResult.operationDescription}`,
        );
      } catch (error: unknown) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${sinValidationRecord.lineNumber} from file ${fileName}`;
        processSummary.error(errorDescription, error);
        this.logger.error(errorDescription, error);
      }
    }

    try {
      // Archive file.
      await this.sinValidationIntegrationService.archiveFile(remoteFilePath);
    } catch (error: unknown) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file archiving, it will be
      // processed again and could be archived in the second attempt.
      const logMessage = `Error while archiving ESDC SIN validation response file: ${remoteFilePath}.`;
      processSummary.error(logMessage, error);
      this.logger.error(logMessage, error);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
