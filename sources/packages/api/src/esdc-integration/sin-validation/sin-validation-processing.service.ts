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
import { Student } from "src/database/entities";
import { ESDC_SIN_VALIDATION_SEQUENCE_GROUP_NAME } from "../../utilities";
import {
  SINValidationRecord,
  SINValidationUploadResult,
} from "./models/sin-validation-models";

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
   * @returns result of the upload operation.
   */
  async uploadSINValidationRequests(): Promise<SINValidationUploadResult> {
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
      async (nextSequenceNumber: number) => {
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
          this.logger.log("Updating the records in SIN Validation table.");
          this.sinValidationService.updateSentRecords(
            sinValidationRecords,
            fileInfo.fileName,
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
      sin: student.sin,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      birthDate: student.birthDate,
      sinValidationId: student.sinValidation.id,
      gender: student.gender,
    } as SINValidationRecord;
  }

  @InjectLogger()
  logger: LoggerService;
}
