import { Injectable } from "@nestjs/common";
import { Student } from "src/database/entities";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  CRAIntegrationService,
  StudentService,
  SequenceControlService,
  ConfigService,
  ApplicationService,
} from "../services";
import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseT4EarningsRecord } from "./cra-files/cra-response-t4earnings-record";
import {
  CRAPersonRecord,
  CRAUploadResult,
  MatchStatusCodes,
  RequestStatusCodes,
  CRAsFtpResponseFile,
  ProcessSftpResponseResult,
} from "./cra-integration.models";

const STUDENT_SIN_VALIDATION_TAG = "STUDENT_SIN_VALIDATION";
const STUDENT_INCOME_VALIDATION = "STUDENT_INCOME_VALIDATION";

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
    private readonly applicationService: ApplicationService,
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
    const students =
      await this.studentService.getStudentsPendingSinValidation();
    if (!students.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(`Found ${students.length} student(s).`);
    const craRecords = students.map((student) => {
      return this.createCRARecordFromStudent(
        student,
        STUDENT_SIN_VALIDATION_TAG,
      );
    });

    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      this.getCRAFileSequenceName(),
      async (nextSequenceNumber: number) => {
        try {
          this.logger.log("Creating matching run content...");
          const fileContent = this.craService.createMatchingRunContent(
            craRecords,
            nextSequenceNumber,
          );
          const fileName =
            this.craService.createRequestFileName(nextSequenceNumber);
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
   * Identifies all the student applications that have a pending
   * income verification and generate the request file to be
   * processed by CRA.
   * @returns Processing result log.
   */
  public async createIncomeValidationRequest(): Promise<CRAUploadResult> {
    this.logger.log(
      "Retrieving student applications that need income validation...",
    );
    const applications =
      await this.applicationService.getPendingIncomeVerifications();
    if (!applications.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(`Found ${applications.length} (s).`);
    const craRecords = applications.map((application) => {
      return this.createCRARecordFromStudent(
        application.student,
        STUDENT_INCOME_VALIDATION,
      );
    });

    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      this.getCRAFileSequenceName(),
      async (nextSequenceNumber: number) => {
        try {
          this.logger.log("Creating income validation content...");
          const fileContent = this.craService.createIncomeValidationContent(
            craRecords,
            nextSequenceNumber,
          );
          const fileName =
            this.craService.createRequestFileName(nextSequenceNumber);
          this.logger.log("Uploading content...");
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileName,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for income validation: ${error}`,
          );
          throw error;
        }
      },
    );

    return uploadResult;
  }

  /**
   * Use the information on the Student and User objects
   * to generate the record to be send to CRA.
   * @param student student and user information.
   * @param freeProjectArea free text to be send together
   * with each record that could be used for process the
   * response file, where this information will also be
   * send back.
   * @returns CRA record for the student.
   */
  private createCRARecordFromStudent(
    student: Student,
    freeProjectArea: string,
  ): CRAPersonRecord {
    return {
      sin: student.sin,
      surname: student.user.lastName,
      givenName: student.user.firstName,
      birthDate: student.birthdate,
      freeProjectArea,
    } as CRAPersonRecord;
  }

  /**
   * Name of the group that controls the sequence number of the
   * CRA file to be generated on table sims.sequence_controls.
   * @returns Sequence group name for the CRA file.
   */
  private getCRAFileSequenceName(): string {
    return `CRA_${
      this.configService.getConfig().CRAIntegration.programAreaCode
    }`;
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
    return Promise.all(filesProcess);
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
      `Processing file ${responseFile.filePath} with ${responseFile.statusRecords.length} records.`,
    );

    for (const statusRecord of responseFile.statusRecords) {
      try {
        // 0022 could be present in a SIN validation response or income verification response.
        // We use the tag STUDENT_SIN_VALIDATION_TAG to process 0022 records only when the
        // request was made specifically for SIN validation.
        if (statusRecord.freeProjectArea == STUDENT_SIN_VALIDATION_TAG) {
          await this.processSINStatus(statusRecord);
          result.processSummary.push(
            `Processed SIN validation for record line ${statusRecord.lineNumber}.`,
          );
        } else {
          // Find the T4 record associated with the status record.
          const t4Earnings = responseFile.t4EarningsRecords.find(
            (t4) => t4.sin === statusRecord.sin,
          );
          await this.processIncomeVerification(statusRecord, t4Earnings);
          result.processSummary.push(
            `Processed income verification for record line ${t4Earnings.lineNumber} with status record from line ${statusRecord.lineNumber}.`,
          );
        }
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${statusRecord.lineNumber} from file ${responseFile.filePath}`;
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
   * @param craRecord CRA status record to be processed.
   */
  private async processSINStatus(
    craRecord: CRAResponseStatusRecord,
  ): Promise<void> {
    const isValidSIN =
      craRecord.requestStatusCode === RequestStatusCodes.successfulRequest &&
      craRecord.matchStatusCode == MatchStatusCodes.successfulMatch;

    await this.studentService.updatePendingSinValidation(
      craRecord.sin,
      isValidSIN,
    );
  }

  /**
   * Process the income verification using the T4 earnings
   * record (0101) received from CRA alongside with the
   * status record (0022).
   * @param statusRecord Status record (0022) received from CRA.
   * @param t4EarningsRecords T4 earnings record (0101) received from CRA.
   * @returns save the result of the income verification to database.
   */
  private async processIncomeVerification(
    statusRecord: CRAResponseStatusRecord,
    t4EarningsRecords: CRAResponseT4EarningsRecord,
  ): Promise<void> {
    // TODO: Temporary code.
    // This will be replace in the upcoming PR when the migrations will be added.
    console.log(statusRecord);
    console.log(t4EarningsRecords);
  }

  @InjectLogger()
  logger: LoggerService;
}
