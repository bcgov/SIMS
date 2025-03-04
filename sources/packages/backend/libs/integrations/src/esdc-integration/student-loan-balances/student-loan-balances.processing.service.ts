import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { StudentLoanBalancesIntegrationService } from "./student-loan-balances.integration.service";
import { StudentLoanBalancesSFTPResponseFile } from "./models/student-loan-balances.model";
import {
  StudentService,
  StudentLoanBalanceService,
} from "@sims/integrations/services";
import * as path from "path";
import { ProcessSummary } from "@sims/utilities/logger";
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import {
  DatabaseConstraintNames,
  StudentLoanBalance,
  isDatabaseConstraintError,
} from "@sims/sims-db";
import { SystemUsersService } from "@sims/services";

/**
 * Manages to process the Student Loan Balances files
 * once they are available in the SFTP location.
 */
@Injectable()
export class StudentLoanBalancesProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly dataSource: DataSource,
    config: ConfigService,
    private readonly studentLoanBalancesIntegrationService: StudentLoanBalancesIntegrationService,
    private readonly studentService: StudentService,
    private readonly studentLoanBalanceService: StudentLoanBalanceService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Download all files from SFTP and process them all.
   * @param parentProcessSummary parent process summary.
   * causing the changes.
   */
  async processStudentLoanBalances(
    parentProcessSummary: ProcessSummary,
  ): Promise<void> {
    // Process summary to be populated by each enqueueing workflow call.
    const remoteFilePaths =
      await this.studentLoanBalancesIntegrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        new RegExp(
          `^${this.esdcConfig.environmentCode}EDU.PBC.PT.MBAL.[0-9]{8}.*`,
          "i",
        ),
      );
    for (const remoteFilePath of remoteFilePaths) {
      const fileProcessingSummary = new ProcessSummary();
      parentProcessSummary.children(fileProcessingSummary);
      await this.processFile(remoteFilePath, fileProcessingSummary);
    }
  }

  /**
   * Process each individual Student Loan Balances response file from the SFTP.
   * @param remoteFilePath Student Loan Balances response file to be processed.
   */
  private async processFile(
    remoteFilePath: string,
    childrenProcessSummary: ProcessSummary,
  ): Promise<void> {
    childrenProcessSummary.info(`Processing file ${remoteFilePath}.`);
    let studentLoanBalancesSFTPResponseFile: StudentLoanBalancesSFTPResponseFile;
    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    let lineNumber: number;
    try {
      studentLoanBalancesSFTPResponseFile =
        await this.studentLoanBalancesIntegrationService.downloadResponseFile(
          remoteFilePath,
        );
      childrenProcessSummary.info(
        `File contains ${studentLoanBalancesSFTPResponseFile.records.length} Student Loan balances.`,
      );
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const studentLoanBalancesRepo =
          transactionalEntityManager.getRepository(StudentLoanBalance);
        for (const studentLoanBalanceRecord of studentLoanBalancesSFTPResponseFile.records) {
          lineNumber = studentLoanBalanceRecord.lineNumber;
          const student = await this.studentService.getStudentByPersonalInfo(
            studentLoanBalanceRecord.sin,
            studentLoanBalanceRecord.lastName,
            getISODateOnlyString(studentLoanBalanceRecord.birthDate),
            transactionalEntityManager,
          );
          // If student not found continue.
          if (!student) {
            childrenProcessSummary.info(
              `Student not found for line ${lineNumber}.`,
            );
            continue;
          }
          await studentLoanBalancesRepo.insert({
            student: student,
            cslBalance: studentLoanBalanceRecord.cslBalance,
            balanceDate: getISODateOnlyString(
              studentLoanBalancesSFTPResponseFile.header.balanceDate,
            ),
            creator: this.systemUsersService.systemUser,
          });
        }
        childrenProcessSummary.info(
          "Checking if zero balance records must be inserted.",
        );
        const insertResult =
          await this.studentLoanBalanceService.insertZeroBalanceRecords(
            studentLoanBalancesSFTPResponseFile.header.balanceDate,
            transactionalEntityManager,
          );
        childrenProcessSummary.info(
          `Amount of zero balance records inserted: ${insertResult.length}.`,
        );
      });
      childrenProcessSummary.info(
        `Inserted Student Loan balances file ${fileName}.`,
      );
    } catch (error: unknown) {
      if (
        isDatabaseConstraintError(
          error,
          DatabaseConstraintNames.StudentLoanBalanceDateUniqueConstraint,
        )
      ) {
        // Log the error but allow the process to continue.
        const errorDescription = `Student loan balance already exists for the student and balance date at line ${lineNumber}.`;
        childrenProcessSummary.error(errorDescription);
      }
      if (error instanceof CustomNamedError) {
        childrenProcessSummary.error(error.message);
      } else {
        // Log the error but allow the process to continue.
        const errorDescription = `Error processing file ${fileName}.`;
        childrenProcessSummary.error(errorDescription, error);
      }
    } finally {
      try {
        // Archive file.
        await this.studentLoanBalancesIntegrationService.archiveFile(
          remoteFilePath,
        );
      } catch (error: unknown) {
        // Log the error but allow the process to continue.
        // If there was an issue only during the file archiving, it will be
        // processed again and could be archived in the second attempt.
        const logMessage = `Error while archiving Student Loan Balances response file: ${remoteFilePath}`;
        childrenProcessSummary.error(logMessage, error);
      }
    }
  }
}
