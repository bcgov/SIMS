import { Injectable } from "@nestjs/common";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { StudentLoanBalancesIntegrationService } from "./student-loan-balances.integration.service";
import { StudentLoanBalancesSFTPResponseFile } from "./models/student-loan-balances.model";
import { StudentService } from "@sims/integrations/services";
import * as path from "path";
import {
  InjectLogger,
  LoggerService,
  ProcessSummary,
} from "@sims/utilities/logger";
import { getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { StudentLoanBalances } from "@sims/sims-db";

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
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Download all files from SFTP and process them all.
   * @param parentProcessSummary parent process summary.
   * @returns Summary with what was processed and the list of all errors, if any.
   */
  async processStudentLoanBalances(
    parentProcessSummary: ProcessSummary,
  ): Promise<void> {
    // Process summary to be populated by each enqueueing workflow call.
    const serviceProcessSummary = new ProcessSummary();
    const remoteFilePaths =
      await this.studentLoanBalancesIntegrationService.getResponseFilesFullPath(
        this.esdcConfig.ftpResponseFolder,
        new RegExp(
          `^${this.esdcConfig.environmentCode}EDU.PBC.PT.MBAL.[0-9]{8}.*`,
          "i",
        ),
      );
    for (const remoteFilePath of remoteFilePaths) {
      await this.processFile(remoteFilePath, serviceProcessSummary);
      parentProcessSummary.children(serviceProcessSummary);
    }
  }

  /**
   * Process each individual Student Loan Balances response file from the SFTP.
   * @param remoteFilePath Student Loan Balances response file to be processed.
   * @returns process summary and errors summary.
   */
  private async processFile(
    remoteFilePath: string,
    childrenProcessSummary: ProcessSummary,
  ): Promise<void> {
    childrenProcessSummary.info(`Processing file ${remoteFilePath}.`);
    let studentLoanBalancesSFTPResponseFile: StudentLoanBalancesSFTPResponseFile;
    try {
      studentLoanBalancesSFTPResponseFile =
        await this.studentLoanBalancesIntegrationService.downloadResponseFile(
          remoteFilePath,
        );
    } catch (error) {
      this.logger.error(error);
      childrenProcessSummary.error(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
    }
    childrenProcessSummary.info(
      `File contains ${studentLoanBalancesSFTPResponseFile.records.length} Student Loan balances.`,
    );
    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const studentLoanBalancesRepo =
          transactionalEntityManager.getRepository(StudentLoanBalances);
        for (const studentLoanBalanceRecord of studentLoanBalancesSFTPResponseFile.records) {
          const student = await this.studentService.getStudentByPersonalInfo(
            studentLoanBalanceRecord.sin,
            studentLoanBalanceRecord.lastName,
            getISODateOnlyString(studentLoanBalanceRecord.birthDate),
            transactionalEntityManager,
          );
          // If student not found continue.
          if (!student) {
            childrenProcessSummary.error(
              `Student not found for line ${studentLoanBalanceRecord.lineNumber}.`,
            );
            continue;
          }

          await studentLoanBalancesRepo.insert({
            studentId: student.id,
            cslBalance: studentLoanBalanceRecord.cslBalance,
            balanceDate: getISODateOnlyString(
              studentLoanBalancesSFTPResponseFile.header.balanceDate,
            ),
          });
        }
      });
      childrenProcessSummary.info(
        `Inserted Student Loan balances file  ${fileName}.`,
      );
    } catch (error) {
      // Log the error but allow the process to continue.
      const errorDescription = `Error processing file ${fileName}.`;
      childrenProcessSummary.error(errorDescription);
      this.logger.error(`${errorDescription}. ${error}`);
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
      childrenProcessSummary.error(logMessage);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
