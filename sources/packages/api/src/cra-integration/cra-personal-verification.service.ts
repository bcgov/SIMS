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
import { getUTCNow } from "../utilities";

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
  async createSinValidationRequest(): Promise<CRAUploadResult> {
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
  async createIncomeVerificationRequest(): Promise<CRAUploadResult> {
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
      const craRecord = this.createCRARecordFromStudent(
        incomeVerification.application.student,
        this.getIncomeVerificationTag(incomeVerification.id),
      );
      craRecord.taxYear = incomeVerification.taxYear;
      return craRecord;
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
            getUTCNow(),
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
  async processResponses(): Promise<ProcessSftpResponseResult[]> {
    const fileNames = await this.craService.getResponseFilesNames();
    const processResult: ProcessSftpResponseResult[] = [];
    for (const fileName of fileNames) {
      const craResponseFile = await this.craService.downloadResponseFile(
        fileName,
      );
      processResult.push(await this.processResponse(craResponseFile));
    }

    return processResult;
  }

  /**
   * Process each individual CRA response file downloaded from the the sFTP.
   * @param responseFile CRA response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processResponse(
    responseFile: CRAsFtpResponseFile,
  ): Promise<ProcessSftpResponseResult> {
    const now = getUTCNow();
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
          // Find the 'Total Income' record associated with the status record.
          // This record may not be present if there is no data for the tax year, for instance.
          const totalIncomeRecord = responseFile.totalIncomeRecords.find(
            (incomeRecord) => incomeRecord.sin === statusRecord.sin,
          );
          await this.processIncomeVerification(
            statusRecord,
            now,
            responseFile.fileName,
            totalIncomeRecord,
          );
          const totalRecordLog = totalIncomeRecord
            ? `Total income record line ${totalIncomeRecord?.lineNumber}`
            : "Total income record not present";
          result.processSummary.push(
            `Processed income verification. ${totalRecordLog}. Status record from line ${statusRecord.lineNumber}.`,
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
      craRecord.matchStatusCode === MatchStatusCodes.successfulMatch;

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
   * @param receivedDate date to be set as received.
   * @param receivedFileName file name of the file that was processed.
   * @param [totalIncomeRecord] when available, it means that the personal
   * data (first name, last name, DOB and SIN) were considered valid by
   * CRA and the income record is present for the requested tax year.
   */
  private async processIncomeVerification(
    statusRecord: CRAResponseStatusRecord,
    receivedDate: Date,
    receivedFileName: string,
    totalIncomeRecord?: CRAResponseTotalIncomeRecord,
  ): Promise<void> {
    // The id to be used to find and update the CRA income verification record
    // must be on the 'freeProjectArea' (e.g. VERIFICATION_ID:12345) that was
    // generated during the file creation to execute the request to CRA.
    const verificationId = this.getIdFromIncomeVerificationIdTag(
      statusRecord.freeProjectArea,
    );
    if (!verificationId) {
      throw new Error(
        `Not able to extract the CRA income verification id from the freeProjectArea ${statusRecord.freeProjectArea}`,
      );
    }

    const isValidResponse =
      statusRecord.requestStatusCode === RequestStatusCodes.successfulRequest &&
      statusRecord.matchStatusCode === MatchStatusCodes.successfulMatch &&
      !!totalIncomeRecord;
    const income = isValidResponse ? totalIncomeRecord.totalIncomeValue : null;

    const updateResult =
      await this.incomeVerificationService.updateReceivedFile(
        verificationId,
        receivedFileName,
        receivedDate,
        statusRecord.matchStatusCode,
        statusRecord.requestStatusCode,
        statusRecord.inactiveCode,
        income,
      );

    // Expected to update 1 and only 1 record.
    if (updateResult.affected !== 1) {
      throw new Error(
        `Error while updating CRA income verification id: ${verificationId}. Number of affected rows was ${updateResult.affected}, expected 1.`,
      );
    }

    // Send a message to the associated workflow to proceed.
    await this.incomeVerificationService.reportIncomeVerificationToWorkflow(
      verificationId,
    );
  }

  /**
   * Gets income verification tag used on the freeProjectArea of the
   * request file. This tag contains the id of the record on table
   * sims.cra_income_verifications that will be used during the
   * interpretation of the response to find the exact record that
   * must be updated.
   * @param id CRA income verification id.
   * @returns income verification tag.
   */
  private getIncomeVerificationTag(id: number): string {
    return `${INCOME_VERIFICATION_TAG}:${id}`;
  }

  /**
   * Gets the id from the income verification that identifies
   * the record on sims.cra_income_verifications that must be
   * updated with the response data from CRA.
   * @param tag tag that contains the id to be extracted.
   * @returns id from income verification id tag
   */
  private getIdFromIncomeVerificationIdTag(tag: string): number | null {
    if (!tag?.includes(":")) {
      return null;
    }
    return +tag.split(":").pop();
  }

  @InjectLogger()
  logger: LoggerService;
}
