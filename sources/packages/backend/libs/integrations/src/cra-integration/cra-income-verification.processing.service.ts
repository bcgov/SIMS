import { Injectable } from "@nestjs/common";
import { CRAIncomeVerification, Student } from "@sims/sims-db";
import { EntityManager } from "typeorm";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { SequenceControlService, WorkflowClientService } from "@sims/services";
import { CRAResponseStatusRecord } from "./cra-files/cra-response-status-record";
import { CRAResponseTotalIncomeRecord } from "./cra-files/cra-response-total-income-record";
import {
  CRAPersonRecord,
  CRAUploadResult,
  MatchStatusCodes,
  RequestStatusCodes,
  CRASFTPResponseFile,
  ProcessSftpResponseResult,
} from "./cra-integration.models";
import { getUTCNow } from "@sims/utilities";
import * as path from "path";
import { ConfigService } from "@sims/utilities/config";
import { CRAIntegrationService } from "./cra.integration.service";
import { CRAIncomeVerificationsService } from "../services";
import { SFTP_ARCHIVE_DIRECTORY } from "@sims/integrations/constants";

const INCOME_VERIFICATION_TAG = "VERIFICATION_ID";

/**
 * Manages the retrieval of students or parents or another
 * individual that needs to have his data verified
 * by the Canada Revenue Agency (CRA).
 */
@Injectable()
export class CRAIncomeVerificationProcessingService {
  private readonly ftpResponseFolder: string;

  constructor(
    private readonly craService: CRAIntegrationService,
    private readonly configService: ConfigService,
    private readonly sequenceService: SequenceControlService,
    private readonly incomeVerificationService: CRAIncomeVerificationsService,
    private readonly workflowClientService: WorkflowClientService,
    config: ConfigService,
  ) {
    this.ftpResponseFolder = config.craIntegration.ftpResponseFolder;
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
      const craRecord = this.createCRARecordFromIncomeVerification(
        incomeVerification,
        this.createFreeProjectArea(
          INCOME_VERIFICATION_TAG,
          incomeVerification.id,
        ),
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
          await this.craService.uploadContent(fileContent, fileInfo.filePath);

          uploadResult = {
            generatedFile: fileInfo.filePath,
            uploadedRecords: fileContent.length - 2, // Do not consider header and footer.
          };

          // Creates the repository based on the entity manager that
          // holds the transaction already created to manage the
          // sequence number.
          const incomeVerificationRepo = entityManager.getRepository(
            CRAIncomeVerification,
          );
          await this.incomeVerificationService.updateSentFile(
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
   * to generate the record to be sent to CRA.
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
      sin: student.sinValidation.sin,
      surname: student.user.lastName,
      givenName: student.user.firstName,
      birthDate: new Date(student.birthDate),
      verificationId: student.sinValidation.id,
      freeProjectArea,
    } as CRAPersonRecord;
  }

  /**
   * Use the information on the CRA income verification,
   * student, supporting user and users to generate
   * the record to be sent to CRA.
   * @param craIncomeVerification income verification record
   * loaded with the student from the application, the supporting
   * user, if present, and the respective users.
   * @param freeProjectArea free text to be send together
   * with each record that could be used for process the
   * response file, where this information will also be
   * send back.
   * @returns CRA record for the student.
   */
  private createCRARecordFromIncomeVerification(
    craIncomeVerification: CRAIncomeVerification,
    freeProjectArea: string,
  ): CRAPersonRecord {
    // If the supporting user has data return the information
    // from the supporting user.
    if (craIncomeVerification.supportingUser) {
      return {
        sin: craIncomeVerification.supportingUser.sin,
        surname: craIncomeVerification.supportingUser.user.lastName,
        givenName: craIncomeVerification.supportingUser.user.firstName,
        birthDate: new Date(craIncomeVerification.supportingUser.birthDate),
        freeProjectArea,
      } as CRAPersonRecord;
    }
    // If the supporting user is empty, return the data from the student
    // associated with the application.
    return this.createCRARecordFromStudent(
      craIncomeVerification.application.student,
      freeProjectArea,
    );
  }

  /**
   * Name of the group that controls the sequence number of the
   * CRA file to be generated on table sims.sequence_controls.
   * @returns Sequence group name for the CRA file.
   */
  private getCRAFileSequenceName(): string {
    return `CRA_${this.configService.craIntegration.programAreaCode}`;
  }

  /**
   * Download all files from CRA Response folder on SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processResponses(): Promise<ProcessSftpResponseResult[]> {
    const remoteFilePaths = await this.craService.getResponseFilesFullPath(
      this.ftpResponseFolder,
      /CCRA_RESPONSE_[\w]*\.txt/i,
    );
    const processFiles: ProcessSftpResponseResult[] = [];
    for (const remoteFilePath of remoteFilePaths) {
      processFiles.push(await this.processFile(remoteFilePath));
    }
    return processFiles;
  }

  /**
   * Process each individual CRA response file from the SFTP.
   * @param remoteFilePath CRA response file to be processed.
   * @returns Process summary and errors summary.
   */
  private async processFile(
    remoteFilePath: string,
  ): Promise<ProcessSftpResponseResult> {
    const now = getUTCNow();
    const result = new ProcessSftpResponseResult();
    result.processSummary.push(`Processing file ${remoteFilePath}.`);

    let responseFile: CRASFTPResponseFile;

    try {
      responseFile = await this.craService.downloadResponseFile(remoteFilePath);
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
      // Abort the process nicely not throwing an exception and
      // allowing other response files to be processed.
      return result;
    }
    debugger;
    result.processSummary.push(
      `File contains ${responseFile.statusRecords.length} verifications.`,
    );

    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    for (const statusRecord of responseFile.statusRecords) {
      try {
        // Use the tag 'VERIFICATION_ID' to ensure that the record is related to a previously requested
        // income verification. The same file can contain SIN validation records and income validation as well.
        if (statusRecord.freeProjectArea.includes(INCOME_VERIFICATION_TAG)) {
          // Find the 'Total Income' record associated with the status record.
          // This record may not be present if there is no data for the tax year, for instance.
          const totalIncomeRecord = responseFile.totalIncomeRecords.find(
            (incomeRecord) => incomeRecord.sin === statusRecord.sin,
          );
          await this.processIncomeVerification(
            statusRecord,
            now,
            fileName,
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
        const errorDescription = `Error processing record line number ${statusRecord.lineNumber} from file ${fileName}`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. Error: ${error}`);
      }
    }

    try {
      // Archive file.
      await this.craService.archiveFile(remoteFilePath, SFTP_ARCHIVE_DIRECTORY);
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file archiving, it will be
      // processed again and could be archived in the second attempt.
      const logMessage = `Error while archiving CRA response file: ${remoteFilePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }

    return result;
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
    const verificationId = this.getIdFromFreeProjectArea(
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
    await this.workflowClientService.sendCRAIncomeVerificationCompletedMessage(
      verificationId,
    );
  }

  /**
   * Gets verification tag used on the freeProjectArea of the
   * request file. This tag contains the id of the record on table
   * sims.cra_income_verifications/cra_sin_validations that will be
   * used during the interpretation of the response to find
   * the exact record that must be updated.
   * @param tag Identifier tag for cra_income_verifications/cra_sin_validations
   * @param id Verification id.
   * @returns Combined string of tag and id appended with ":".
   */
  private createFreeProjectArea(tag: string, id: number): string {
    return `${tag}:${id}`;
  }

  /**
   * Gets the id from the freeProjectArea that identifies
   * the record on sims.cra_income_verifications/cra_sin_validations
   *  that must be updated with the response data from CRA.
   * @param tag tag that contains the id to be extracted.
   * @returns id from verification id tag
   */
  private getIdFromFreeProjectArea(tag: string): number | null {
    if (!tag?.includes(":")) {
      return null;
    }
    return +tag.split(":").pop();
  }

  @InjectLogger()
  logger: LoggerService;
}
