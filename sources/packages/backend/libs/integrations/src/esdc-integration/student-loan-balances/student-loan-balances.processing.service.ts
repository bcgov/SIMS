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
import { CustomNamedError, getISODateOnlyString } from "@sims/utilities";
import { DataSource } from "typeorm";
import { StudentLoanBalance, User } from "@sims/sims-db";
import { STUDENT_LOAN_BALANCE_DUPLICATE_RECORD } from "@sims/services/constants";

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
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  async processStudentLoanBalances(
    parentProcessSummary: ProcessSummary,
    auditUserId: number,
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
      await this.processFile(
        remoteFilePath,
        fileProcessingSummary,
        auditUserId,
      );
    }
  }

  /**
   * Process each individual Student Loan Balances response file from the SFTP.
   * @param remoteFilePath Student Loan Balances response file to be processed.
   * @param auditUserId user that should be considered the one that is
   * causing the changes.
   */
  private async processFile(
    remoteFilePath: string,
    childrenProcessSummary: ProcessSummary,
    auditUserId: number,
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
      if (error instanceof CustomNamedError) {
        childrenProcessSummary.error(error.message);
      } else {
        childrenProcessSummary.error(
          `Error processing file ${remoteFilePath}. Error: ${error.message}`,
        );
      }
    }
    childrenProcessSummary.info(
      `File contains ${studentLoanBalancesSFTPResponseFile.records.length} Student Loan balances.`,
    );
    // Get only the file name for logging.
    const fileName = path.basename(remoteFilePath);
    try {
      await this.dataSource.transaction(async (transactionalEntityManager) => {
        const studentLoanBalancesRepo =
          transactionalEntityManager.getRepository(StudentLoanBalance);
        for (const studentLoanBalanceRecord of studentLoanBalancesSFTPResponseFile.records) {
          const student = await this.studentService.getStudentByPersonalInfo(
            studentLoanBalanceRecord.sin,
            studentLoanBalanceRecord.lastName,
            getISODateOnlyString(studentLoanBalanceRecord.birthDate),
            transactionalEntityManager,
          );
          // If student not found continue.
          if (!student) {
            childrenProcessSummary.info(
              `Student not found for line ${studentLoanBalanceRecord.lineNumber}.`,
            );
            continue;
          }
          const auditUser = { id: auditUserId } as User;
          await studentLoanBalancesRepo.insert({
            student: student,
            cslBalance: studentLoanBalanceRecord.cslBalance,
            balanceDate: getISODateOnlyString(
              studentLoanBalancesSFTPResponseFile.header.balanceDate,
            ),
            creator: auditUser,
          });
        }
      });
      childrenProcessSummary.info(
        `Inserted Student Loan balances file ${fileName}.`,
      );
    } catch (error) {
      // Log the error but allow the process to continue.
      const errorDescription = `Error processing file ${fileName}.`;
      childrenProcessSummary.error(`${errorDescription} ${error.message}`);
      this.logger.error(`${errorDescription} ${error.message}`);
      if (error instanceof Error) {
        throw new CustomNamedError(
          "Student loan balance has duplicate record.",
          STUDENT_LOAN_BALANCE_DUPLICATE_RECORD,
        );
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
      childrenProcessSummary.error(logMessage);
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
