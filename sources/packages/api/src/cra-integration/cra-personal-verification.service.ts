import { Injectable } from "@nestjs/common";
import { CRAIncomeVerification, Student } from "../database/entities";
import { EntityManager } from "typeorm";
import { InjectLogger } from "../common";
import { LoggerService } from "../logger/logger.service";
import {
  CRAIntegrationService,
  StudentService,
  SequenceControlService,
  ConfigService,
  CRAIncomeVerificationService,
} from "../services";
import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseTotalIncomeRecord } from "./cra-files/cra-response-total-income-record";
import {
  CRAPersonRecord,
  CRAUploadResult,
  MatchStatusCodes,
  RequestStatusCodes,
  CRAsFtpResponseFile,
  ProcessSftpResponseResult,
} from "./cra-integration.models";

const STUDENT_SIN_VALIDATION_TAG = "STUDENT_SIN_VALIDATION";
const INCOME_VERIFICATION_TAG = "VERIFICATION_ID";

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
    private readonly incomeVerificationService: CRAIncomeVerificationService,
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
          const fileInfo =
            this.craService.createRequestFileName(nextSequenceNumber);
          this.logger.log("Uploading content...");
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileInfo.filePath,
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
  public async createIncomeVerificationRequest(): Promise<CRAUploadResult> {
    this.logger.log("Retrieving records that need income verification...");
    const incomeVerifications =
      await this.incomeVerificationService.getPendingIncomeVerifications();
    if (!incomeVerifications.length) {
      return {
        generatedFile: "none",
        uploadedRecords: 0,
      };
    }

    this.logger.log(
      `Found ${incomeVerifications.length} income verification(s) to be executed.`,
    );
    const craRecords = incomeVerifications.map((incomeVerification) => {
      return this.createCRARecordFromStudent(
        incomeVerification.application.student,
        this.getIncomeVerificationTag(incomeVerification.id),
      );
    });

    const verificationsIds = incomeVerifications.map(
      (incomeVerification) => incomeVerification.id,
    );

    let uploadResult: CRAUploadResult;
    await this.sequenceService.consumeNextSequence(
      this.getCRAFileSequenceName(),
      async (nextSequenceNumber: number, entityManager: EntityManager) => {
        try {
          this.logger.log("Creating income verification content...");
          const fileContent = this.craService.createIncomeValidationContent(
            craRecords,
            nextSequenceNumber,
          );
          const fileInfo =
            this.craService.createRequestFileName(nextSequenceNumber);
          this.logger.log("Uploading content...");
          uploadResult = await this.craService.uploadContent(
            fileContent,
            fileInfo.filePath,
          );

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const incomeVerificationRepo = entityManager.getRepository(
            CRAIncomeVerification,
          );
          this.incomeVerificationService.updateSentFile(
            verificationsIds,
            new Date(),
            fileInfo.fileName,
            incomeVerificationRepo,
          );
        } catch (error) {
          this.logger.error(
            `Error while uploading content for income verification: ${error}`,
          );
          throw error;
        }
      },
    );

    return uploadResult;
  }

  private getIncomeVerificationTag(id: number): string {
    return `${INCOME_VERIFICATION_TAG}:${id}`;
  }

  private getIdFromIncomeVerificationIdTag(tag: string): number | null {
    if (!tag?.length) {
      return null;
    }

    const splittedTag = tag.split(":");
    if (splittedTag.length === 2) {
      return +splittedTag[1];
    }

    return null;
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
      `Processing file ${responseFile.filePath} with ${responseFile.statusRecords.length} verifications.`,
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
          const totalIncomeRecord = responseFile.totalIncomeRecords.find(
            (incomeRecord) => incomeRecord.sin === statusRecord.sin,
          );
          await this.processIncomeVerification(statusRecord, totalIncomeRecord);
          result.processSummary.push(
            `Processed income verification for record line ${totalIncomeRecord.lineNumber} with status record from line ${statusRecord.lineNumber}.`,
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
   * Process the income verification using the total income
   * record (0150) received from CRA alongside with the
   * status record (0022).
   * @param statusRecord status record (0022) received from CRA.
   * @param totalIncomeRecord total income record (0150) received from CRA.
   * @returns save the result of the income verification to database.
   */
  private async processIncomeVerification(
    statusRecord: CRAResponseStatusRecord,
    totalIncomeRecord?: CRAResponseTotalIncomeRecord,
  ): Promise<void> {
    // TODO: Temporary code.
    // This will be replace in the upcoming PR when the migrations will be added.
    console.log("Executing income verification");
    console.log("T4EarningsValue:", totalIncomeRecord?.totalIncomeValue);
  }

  @InjectLogger()
  logger: LoggerService;
}
