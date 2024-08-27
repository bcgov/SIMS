import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { FedRestrictionIntegrationService } from "./fed-restriction.integration.service";
import { DataSource, InsertResult } from "typeorm";
import { FederalRestriction, Restriction } from "@sims/sims-db";
import { getISODateOnlyString, SFTP_ARCHIVE_DIRECTORY } from "@sims/utilities";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";
import { ProcessSFTPResponseResult } from "../models/esdc-integration.model";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT } from "@sims/services/constants";
import {
  FederalRestrictionService,
  RestrictionService,
} from "@sims/integrations/services";
import { SystemUsersService } from "@sims/services/system-users";
import { StudentRestrictionSharedService } from "@sims/services";
import * as path from "path";

/**
 * Used to limit the number of asynchronous operations that will
 * start at the same time while inserting the records.
 */
const FEDERAL_RESTRICTION_BULK_INSERT_MAX_PARALLELISM = 4;

/**
 * Manages the process to import the entire snapshot of federal
 * restrictions, that is received daily, and update the students
 * restrictions, adding and deactivating accordingly.
 * * This process does not affect provincial restrictions.
 */
@Injectable()
export class FedRestrictionProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly dataSource: DataSource,
    config: ConfigService,
    private readonly restrictionService: RestrictionService,
    private readonly federalRestrictionService: FederalRestrictionService,
    private readonly integrationService: FedRestrictionIntegrationService,
    private readonly studentRestrictionsService: StudentRestrictionSharedService,
    private readonly systemUsersService: SystemUsersService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Import all the federal restrictions from the SFTP and process as below:
   * 1. If the restriction is present on federal data and not on the
   * student data, create a new active restriction;
   * 2. If the restriction in present and active on the student data
   * but it is not present on federal data, deactivate it;
   * 3. If the restriction is present on federal data and it is also
   * present and active on student data, update the updated_at only.
   * @returns process response.
   */
  async process(): Promise<ProcessSFTPResponseResult> {
    const auditUser = this.systemUsersService.systemUser;
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}CSLS\\.PBC\\.RESTR\\.LIST\\.D[\\w]*\\.[\\d]*$`,
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
        auditUser.id,
      );
      // If there are more than one file, archive it.
      // Only the most updated file matters because it represents the entire data snapshot.
      for (const remoteFilePath of filePaths) {
        try {
          const newRemoteFilePath = this.getArchiveFilePath(remoteFilePath);
          await this.integrationService.renameFile(
            remoteFilePath,
            newRemoteFilePath,
          );
        } catch (error) {
          result.errorsSummary.push(
            `Error while archiving federal restrictions file: ${remoteFilePath}`,
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

  /**
   * Gets a new file path to archive the file.
   * @param remoteFilePath full file path with a file name.
   * @returns new full file path with a file name.
   */
  private getArchiveFilePath(remoteFilePath: string) {
    const directoryPath = path.dirname(remoteFilePath);
    const fileBaseName = path.basename(remoteFilePath);
    const newRemoteFilePath = path.join(
      directoryPath,
      SFTP_ARCHIVE_DIRECTORY,
      fileBaseName,
    );
    return newRemoteFilePath;
  }

  /**
   * Process all the federal restrictions records in the file.
   * @param remoteFilePath remote file to be processed.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @returns result of the processing, summary and errors.
   */
  private async processAllRestrictions(
    remoteFilePath: string,
    auditUserId: number,
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
    const queryRunner = this.dataSource.createQueryRunner();
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

      // Hold all the promises that must be processed.
      const promises: Promise<InsertResult | void>[] = [];
      this.logger.log("Starting bulk insert...");
      let hasBulkInsertError = false;
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
            (fedRestriction) => fedRestriction.restrictionCode == codeToFind,
          );
          const newRestriction = new FederalRestriction();
          newRestriction.lastName = restriction.surname;
          newRestriction.sin = restriction.sin;
          // The insert of federal restriction always comes from an external source through integration.
          // Hence birth date is parsed as date object from external source as their date format
          // may not be necessarily ISO date format.
          newRestriction.birthDate = getISODateOnlyString(
            restriction.dateOfBirth,
          );
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
            const logMessage = `Error while inserting the block of lines from ${firstLineNumber} to ${lastLineNumber}`;
            result.errorsSummary.push(logMessage);
            result.errorsSummary.push(error.message);
            this.logger.error(logMessage);
            this.logger.error(error);
            hasBulkInsertError = true;
          });
        promises.push(insertPromises);
        if (
          promises.length >= FEDERAL_RESTRICTION_BULK_INSERT_MAX_PARALLELISM
        ) {
          // Waits for all to be processed or some to fail.
          await Promise.all(promises);
          // Clear the array.
          promises.splice(0, promises.length);
        }
      }

      // Waits any promise not already executed.
      await Promise.all(promises);

      if (hasBulkInsertError) {
        const logMessage =
          "Aborting process due to an error on the bulk insert.";
        result.errorsSummary.push(logMessage);
        this.logger.error(logMessage);
        await queryRunner.rollbackTransaction();
        return result;
      }

      this.logger.log("Bulk data insert finished.");
      this.logger.log(
        "Starting bulk operations to update student restrictions.",
      );
      const insertedRestrictionsIDs =
        await this.federalRestrictionService.executeBulkStepsChanges(
          queryRunner.manager,
        );

      await queryRunner.commitTransaction();
      this.logger.log("Process finished, transaction committed.");

      // The process of sending the notifications happens after the restrictions are committed
      // because the notifications are considered a lower priority and any error related to the
      // notification should not interfere with the federal restriction process.
      try {
        if (insertedRestrictionsIDs?.length) {
          this.logger.log(
            `Generating ${insertedRestrictionsIDs.length} notification(s).`,
          );
          await this.studentRestrictionsService.createNotifications(
            insertedRestrictionsIDs,
            auditUserId,
          );
          result.processSummary.push(
            `${insertedRestrictionsIDs.length} notification(s) generated.`,
          );
        } else {
          result.processSummary.push(
            "No notifications were generated because no new student restriction record was created.",
          );
        }
      } catch (error: unknown) {
        result.errorsSummary.push(
          "Error while generating notifications. See logs for details",
        );
        this.logger.error(`Error while generating notifications. ${error}`);
      }
    } catch (error) {
      const logMessage =
        "Unexpected error while processing federal restrictions. Executing rollback.";
      result.errorsSummary.push(logMessage);
      result.errorsSummary.push(error.message);
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
