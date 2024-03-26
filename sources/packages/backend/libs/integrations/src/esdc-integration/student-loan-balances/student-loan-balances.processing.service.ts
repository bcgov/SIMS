import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { StudentLoanBalancesIntegrationService } from "./student-loan-balances.integration.service";
import { StudentLoanBalancesSFTPResponseFile } from "./models/student-loan-balances.model";
import {
  StudentLoanBalancesService,
  StudentService,
} from "@sims/integrations/services";
import * as path from "path";
import { InjectLogger, LoggerService } from "@sims/utilities/logger";
import { Student } from "@sims/sims-db";
import { StudentLoanBalances } from "@sims/sims-db/entities/student-loan-balances.model";
import { getISODateOnlyString } from "@sims/utilities";

/**
 * Manages to process the Student Loan Balances files
 * once they are available in the SFTP location.
 */
@Injectable()
export class StudentLoanBalancesProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly studentLoanBalancesIntegrationService: StudentLoanBalancesIntegrationService,
    private readonly studentLoanBalancesService: StudentLoanBalancesService,
    private readonly studentService: StudentService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Download all files from SFTP and process them all.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processStudentLoanBalances(): Promise<ProcessSFTPResponseResult[]> {
    const remoteFilePaths =
      await this.studentLoanBalancesIntegrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        new RegExp(
          `^${this.esdcConfig.environmentCode}EDU.PBC.PT.MBAL.[0-9]{8}.*`,
          "i",
        ),
      );
    // Sort remote file paths by name.
    remoteFilePaths.sort((a, b) => a.localeCompare(b));
    const processFiles: ProcessSFTPResponseResult[] = [];
    for (const remoteFilePath of remoteFilePaths) {
      processFiles.push(await this.processFile(remoteFilePath));
    }
    return processFiles;
  }

  /**
   * Process each individual Student Loan Balances response file from the SFTP.
   * @param remoteFilePath Student Loan Balances response file to be processed.
   * @returns process summary and errors summary.
   */
  private async processFile(
    remoteFilePath: string,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${remoteFilePath}.`);
    let studentLoanBalancesSFTPResponseFile: StudentLoanBalancesSFTPResponseFile;
    try {
      studentLoanBalancesSFTPResponseFile =
        await this.studentLoanBalancesIntegrationService.downloadResponseFile(
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
      `File contains ${studentLoanBalancesSFTPResponseFile.records.length} Student Loan balances.`,
    );
    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    for (const studentLoanBalanceRecord of studentLoanBalancesSFTPResponseFile.records) {
      try {
        const student: Student =
          await this.studentService.getStudentByPersonalInfo(
            studentLoanBalanceRecord.sin,
            studentLoanBalanceRecord.lastName,
            getISODateOnlyString(studentLoanBalanceRecord.birthDate),
          );
        if (!student) {
          result.processSummary.push(
            `Student not found for line ${studentLoanBalanceRecord.lineNumber}`,
          );
          continue;
        }
        const studentLoanBalances = new StudentLoanBalances();
        studentLoanBalances.student = student;
        studentLoanBalances.cslBalance = studentLoanBalanceRecord.cslBalance;
        studentLoanBalances.balanceDate =
          studentLoanBalancesSFTPResponseFile.header.balanceDate;
        await this.studentLoanBalancesService.save(studentLoanBalances);
        result.processSummary.push(
          `Inserted Student Loan balances record from line ${studentLoanBalanceRecord.lineNumber}.`,
        );
      } catch (error) {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing record line number ${studentLoanBalanceRecord.lineNumber} from file ${fileName}.`;
        result.errorsSummary.push(errorDescription);
        this.logger.error(`${errorDescription}. ${error}`);
      }
    }
    try {
      await this.studentLoanBalancesIntegrationService.deleteFile(
        remoteFilePath,
      );
    } catch (error) {
      // Log the error but allow the process to continue.
      // If there was an issue only during the file removal, it will be
      // processed again and could be deleted in the second attempt.
      const logMessage = `Error while deleting Student Loan Balances response file: ${remoteFilePath}`;
      this.logger.error(logMessage);
      result.errorsSummary.push(logMessage);
    }
    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
