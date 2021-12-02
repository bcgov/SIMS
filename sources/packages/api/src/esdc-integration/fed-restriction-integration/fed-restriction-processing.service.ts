import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { Inject, Injectable } from "@nestjs/common";
import {
  ConfigService,
  FederalRestrictionService,
  RestrictionService,
} from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { ESDCIntegrationConfig } from "../../types";
import * as os from "os";
import { Connection, InsertResult } from "typeorm";
import { FederalRestriction, Restriction } from "../../database/entities";
import { FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT } from "../../utilities";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";
import { ProcessSFTPResponseResult } from "./fed-restriction-integration.models";

@Injectable()
export class FedRestrictionProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    @Inject("Connection") private readonly connection: Connection,
    config: ConfigService,
    private readonly restrictionService: RestrictionService,
    private readonly federalRestrictionService: FederalRestrictionService,
    private readonly integrationService: FedRestrictionIntegrationService,
  ) {
    this.esdcConfig = config.getConfig().ESDCIntegration;
  }

  async process(): Promise<ProcessSFTPResponseResult> {
    //const results: ProcessSftpResponseResult[] = [];
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `${this.esdcConfig.environmentCode}CSLS.PBC.RESTR.LIST.D[\w]*\.[0-9]*`,
      "i",
    );
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      fileSearch,
    );

    let result: ProcessSFTPResponseResult;
    if (filePaths.length > 0) {
      // Process only the most updated file.
      result = await this.processAllRestrictions(
        filePaths[filePaths.length - 1],
      );
      // If there are more than one file, delete it.
      // Only the most updated file matters because it represents the entire data snapshot.
      for (const remoteFilePath of filePaths) {
        try {
          await this.integrationService.deleteFile(remoteFilePath);
        } catch (error) {
          result.errorsSummary.push(
            `Error while deleting federal restrictions file: ${remoteFilePath}`,
          );
          result.errorsSummary.push(error);
        }
      }
    } else {
      result = new ProcessSFTPResponseResult();
      result.processSummary.push(
        "No files found to be processed at this time.",
      );
    }

    return result;
  }

  private async processAllRestrictions(
    remoteFilePath: string,
  ): Promise<ProcessSFTPResponseResult> {
    const result = new ProcessSFTPResponseResult();
    result.processSummary.push(`Processing file ${remoteFilePath}.`);

    let downloadResult: FedRestrictionFileRecord[];
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    try {
      // Download the Federal Restrictions file with the full snapshot of the data.
      downloadResult = await this.integrationService.downloadResponseFile(
        remoteFilePath,
      );
      this.logger.log("File download finished.");
    } catch (error) {
      this.logger.error(error);
      result.errorsSummary.push(
        `Error downloading file ${remoteFilePath}. Error: ${error}`,
      );
      return result;
    }

    this.logger.log("Starting database transaction.");
    // Start the transaction that will handle all the import.
    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Will contains all restriction codes.
      const restrictionCodes: string[] = [];
      // The file received contains possible invalid records that are not possible to be
      // eliminated prior to the file import. This array will contain the records considered
      // valid to be inserted.
      const sanitizedRestrictions: FedRestrictionFileRecord[] = [];
      this.logger.log("Removing records with invalid data.");
      downloadResult.forEach((restriction) => {
        const invalidDataMessage = restriction.getInvalidDataMessage();
        if (invalidDataMessage) {
          const errorMessage = `Found record with invalid data at line number ${restriction.lineNumber}: ${invalidDataMessage}`;
          result.errorsSummary.push(errorMessage);
          this.logger.error(errorMessage);
        } else {
          sanitizedRestrictions.push(restriction);
          restrictionCodes.push(restriction.getComposedCode());
        }
      });

      const federalRestrictionRepo =
        queryRunner.manager.getRepository(FederalRestriction);
      const restrictionRepo = queryRunner.manager.getRepository(Restriction);

      // Check in advance if all restrictions codes are present in our database.
      // This process is done before the records are inserted to avoid concurrency
      // issues that would happen if the missing codes were added alongside with
      // the records inserts.
      this.logger.log(
        "Checking if all restriction codes are present on the database.",
      );
      const federalRestrictions =
        await this.restrictionService.ensureFederalRestrictionExists(
          restrictionCodes,
          restrictionRepo,
        );

      if (federalRestrictions.createdRestrictionsCodes.length > 0) {
        const logMessage = `New restrictions created: ${federalRestrictions.createdRestrictionsCodes.join(
          ", ",
        )}`;
        result.processSummary.push(logMessage);
        this.logger.warn(logMessage);
      }

      this.logger.log("Truncating federal restrictions table...");
      await this.federalRestrictionService.resetFederalRestrictionsTable(
        queryRunner.manager,
      );

      // Used to limit the number of asynchronous operations
      // that will start at the same time.
      const maxPromisesAllowed = os.cpus().length;
      // Hold all the promises that must be processed.
      const promises: Promise<InsertResult | void>[] = [];
      this.logger.log("Starting bulk insert...");
      while (sanitizedRestrictions.length > 0) {
        // DB restriction objects to be inserted to the db.
        const restrictionsToInsert: FederalRestriction[] = [];
        // Restrictions retrieved from the import file.
        // Insert a certain amount every time.
        const restrictionsToBulkInsert = sanitizedRestrictions.splice(
          0,
          FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT,
        );
        for (const restriction of restrictionsToBulkInsert) {
          const codeToFind = restriction.getComposedCode();
          const restrictionRecord = federalRestrictions.restrictions.find(
            (restriction) => restriction.restrictionCode == codeToFind,
          );
          const newRestriction = new FederalRestriction();
          newRestriction.lastName = restriction.surname;
          newRestriction.sin = restriction.sin;
          newRestriction.birthDate = restriction.dateOfBirth;
          newRestriction.restriction = restrictionRecord;
          restrictionsToInsert.push(newRestriction);
        }

        const insertPromises = federalRestrictionRepo
          .insert(restrictionsToInsert)
          .catch((error) => {
            const firstLineNumber = restrictionsToBulkInsert[0].lineNumber;
            const lastLineNumber =
              restrictionsToBulkInsert[restrictionsToBulkInsert.length - 1]
                .lineNumber;
            const logMessage = `Error while inserting the block of lines from ${firstLineNumber} to ${lastLineNumber}: ${error}`;
            result.errorsSummary.push(logMessage);
            this.logger.error(logMessage);
          });
        promises.push(insertPromises);
        if (promises.length >= maxPromisesAllowed) {
          // Waits for all to be processed.
          await Promise.allSettled(promises);
          // Clear the array.
          promises.splice(0, promises.length);
        }
      }

      // Waits any promise not already executed.
      await Promise.allSettled(promises);

      this.logger.log("Bulk data insert finished.");
      this.logger.log(
        "Starting bulk operations to update student restrictions.",
      );
      await this.federalRestrictionService.executeBulkStepsChanges(
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();
      this.logger.log("Process finished, transaction committed.");
    } catch (error) {
      const logMessage =
        "Unexpected error while processing federal restrictions. Executing rollback.";
      result.errorsSummary.push(logMessage);
      result.errorsSummary.push(error);
      this.logger.error(logMessage);
      this.logger.error(error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
