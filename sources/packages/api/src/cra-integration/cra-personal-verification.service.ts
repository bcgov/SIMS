import { Injectable } from "@nestjs/common";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  CRAIntegrationService,
  StudentService,
  SequenceControlService,
  ConfigService,
} from "../services";
import { CRAResponseFileLine } from "./cra-files/cra-file-response-record";
import {
  CRAPersonRecord,
  CRAUploadResult,
  MatchStatusCodes,
  RequestStatusCodes,
  TransactionSubCodes,
  CRAsFtpResponseFile,
  ProcessSftpResponseResult,
} from "./cra-integration.models";

const STUDENT_SIN_VALIDATION_TAG = "STUDENT_SIN_VALIDATION";

/**
 * Manages the retrieval of students or parents or another
 * individual that needs to have his data verified
 * by the Canada Revenue Agency (CRA).
 */
@Injectable()
export class CRAPersonalVerificationService {
  constructor(
    private readonly craService: CRAIntegrationService,
    private readonly studentService: StudentService,
    private readonly configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
  ) {}

  /**
   * Identifies all the students that still do not have their SIN
   * validated and create the validation request for CRA processing.
   * In the future more personal verification for others type of
   * individuals (e.g. parents) should be added and they will probably
   * be send as one single batch for CRA processing.
   * @returns SIN validation request.
   */
  public async createSinValidationRequest(): Promise<CRAUploadResult> {
    this.logger.log("Retrieving students with pending SIN validation...");
    const students = await this.studentService.getStudentsPendingSinValidation();
    if (!students.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(`Found ${students.length} student(s).`);
    const craRecords = students.map((student) => {
      return {
        sin: student.sin,
        surname: student.user.lastName,
        givenName: student.user.firstName,
        birthDate: student.birthdate,
        freeProjectArea: STUDENT_SIN_VALIDATION_TAG,
      } as CRAPersonRecord;
    });

    const sequenceName = `CRA_${
      this.configService.getConfig().CRAIntegration.programAreaCode
    }`;

    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      sequenceName,
      async (nextSequenceNumber: number) => {
        try {
          this.logger.log("Creating matching run content...");
          const fileContent = this.craService.createMatchingRunContent(
            craRecords,
            nextSequenceNumber,
          );
          const fileName = this.craService.createRequestFileName(
            nextSequenceNumber,
          );
          this.logger.log("Uploading content...");
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileName,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for SIN verification: ${error}`,
          );
          throw error;
        }
      },
    );

    return uploadResult;
  }

  /**
   * Download all files from CRA Response folder on sFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  public async processResponses(): Promise<ProcessSftpResponseResult[]> {
    const files = await this.craService.downloadResponseFiles();
    // Executes the processing of each file in parallel.
    const filesProcess = files.map((file) => this.processResponse(file));
    // Waits for all the parallel processes to be finished.
    return await Promise.all(filesProcess);
  }

  /**
   * Process each individual CRA response file downloaded from the the sFTP.
   * @param responseFile CRA response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processResponse(
    responseFile: CRAsFtpResponseFile,
  ): Promise<ProcessSftpResponseResult> {
    const result = new ProcessSftpResponseResult();
    result.processSummary.push(
      `Processing file ${responseFile.filePath} with ${responseFile.records.length} records.`,
    );

    for (let index = 0; index < responseFile.records.length; index++) {
      try {
        const record = responseFile.records[index];
        // Checks the type of record to define if must be processed.
        // If the record type is 0022, it should process the SIN validation.
        if (record.transactionSubCode === TransactionSubCodes.ResponseRecord) {
          const craRecord = record as CRAResponseFileLine;
          // 0022 could be present in a SIN validation response or income verification response.
          // We use the tag STUDENT_SIN_VALIDATION_TAG to process 0022 records only when the
          // request was made specifically for SIN validation.
          if (craRecord.freeProjectArea == STUDENT_SIN_VALIDATION_TAG) {
            await this.processSINStatus(craRecord);
            result.processSummary.push(
              `Processed SIN validation for record line ${index + 1}.`,
            );
          }
          // TODO: Add the check to process income verification.
        }
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${
          index + 1
        } from file ${responseFile.filePath}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      await this.craService.deleteFile(responseFile.filePath);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting CRA response file: ${responseFile.filePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
  }

  /**
   * Process a 0022 record to update the SIN status.
   * @param craRecord
   */
  private async processSINStatus(
    craRecord: CRAResponseFileLine,
  ): Promise<void> {
    const isValidSIN =
      craRecord.requestStatusCode === RequestStatusCodes.successfulRequest &&
      craRecord.matchStatusCode == MatchStatusCodes.successfulMatch;

    await this.studentService.updatePendingSinValidation(
      craRecord.sin,
      isValidSIN,
    );
  }

  @InjectLogger()
  logger: LoggerService;
}
