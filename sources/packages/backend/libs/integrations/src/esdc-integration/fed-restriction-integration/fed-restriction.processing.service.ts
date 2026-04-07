import { LoggerService, ProcessSummary } from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { FedRestrictionIntegrationService } from "./fed-restriction.integration.service";
import { EntityManager } from "typeorm";
import {
  FederalRestriction,
  Restriction,
  RestrictionType,
} from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT } from "@sims/services/constants";
import {
  FederalRestrictionService,
  RestrictionService,
} from "@sims/integrations/services";
import { SystemUsersService } from "@sims/services/system-users";
import { StudentRestrictionSharedService } from "@sims/services";

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
    config: ConfigService,
    private readonly federalRestrictionService: FederalRestrictionService,
    private readonly integrationService: FedRestrictionIntegrationService,
    private readonly studentRestrictionsService: StudentRestrictionSharedService,
    private readonly systemUsersService: SystemUsersService,
    private readonly logger: LoggerService,
    private readonly restrictionService: RestrictionService,
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
   * @param processSummary process summary for logging.
   * @param entityManager entity manager to execute all DB operations
   * in the same transaction.
   * @returns process response.
   */
  async process(
    processSummary: ProcessSummary,
    entityManager: EntityManager,
  ): Promise<void> {
    const auditUser = this.systemUsersService.systemUser;
    // Get the list of all ZIP files from SFTP ordered by file name.
    const fileSearch = new RegExp(
      `^${this.esdcConfig.environmentCode}CSLS\\.PBC\\.RESTR\\.LIST\\.D[\\w]*\\.[\\d]*\\.(zip|ZIP)$`,
      "i",
    );
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.esdcConfig.ftpResponseFolder,
      fileSearch,
    );
    if (filePaths.length > 0) {
      // Process only the most updated file.
      await this.processRestrictionsFile(
        filePaths[filePaths.length - 1],
        auditUser.id,
        processSummary,
        entityManager,
      );
      // If there are more than one file, archive it.
      // Only the most updated file matters because it represents the entire data snapshot.
      for (const remoteFilePath of filePaths) {
        try {
          await this.integrationService.archiveFile(remoteFilePath);
        } catch (error) {
          const logMessage = `Error while archiving federal restrictions file: ${remoteFilePath}`;
          processSummary.error(logMessage, error);
          this.logger.error(logMessage, error);
        }
      }
    } else {
      processSummary.info("No files found to be processed at this time.");
    }
  }

  /**
   * Process all the federal restrictions records in the file.
   * @param remoteFilePath remote file to be processed.
   * @param auditUserId user that should be considered the one that is causing the changes.
   * @param processSummary process summary for logging.
   * @returns result of the processing, summary and errors.
   */
  private async processRestrictionsFile(
    remoteFilePath: string,
    auditUserId: number,
    processSummary: ProcessSummary,
    entityManager: EntityManager,
  ): Promise<void> {
    processSummary.info(`Processing file ${remoteFilePath}.`);
    let insertedRestrictionsIDs: number[] = [];
    try {
      this.logger.log("Starting database transaction.");
      // Start the transaction that will handle all the import.
      await this.downloadIntoTransientTable(
        remoteFilePath,
        entityManager,
        processSummary,
      );
      this.logger.log(
        "Starting bulk operations to update student restrictions.",
      );
      insertedRestrictionsIDs =
        await this.federalRestrictionService.executeBulkStepsChanges(
          entityManager,
        );
      this.logger.log("Process finished, transaction committed.");
    } catch (error: unknown) {
      const logMessage =
        "Unexpected error while processing federal restrictions. Executing rollback.";
      this.logger.error(logMessage, error);
      throw new Error(logMessage, { cause: error });
    }
    // Generate the notifications.
    try {
      if (insertedRestrictionsIDs?.length) {
        this.logger.log(
          `Generating ${insertedRestrictionsIDs.length} notification(s).`,
        );
        await this.studentRestrictionsService.createNotifications(
          insertedRestrictionsIDs,
          auditUserId,
          entityManager,
        );
        processSummary.info(
          `${insertedRestrictionsIDs.length} notification(s) generated.`,
        );
      } else {
        processSummary.info(
          "No notifications were generated because no new student restriction record was created.",
        );
      }
    } catch (error: unknown) {
      const errorMessage = "Error while generating notifications.";
      this.logger.error(errorMessage, error);
      throw new Error(errorMessage, { cause: error });
    }
  }

  /**
   * Execute the download of the file, validate and transform the data, and insert it into a
   * transient table to be used on the next steps of the process.
   * The file download and the insert into the transient table is done in batches to avoid
   * memory issues and improve performance.
   * @param remoteFilePath remote file to be downloaded and inserted into the transient table.
   * @param processSummary process summary for logging.
   * @param entityManager entity manager to use for the database operations.
   */
  private async downloadIntoTransientTable(
    remoteFilePath: string,
    entityManager: EntityManager,
    processSummary: ProcessSummary,
  ): Promise<void> {
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    try {
      this.logger.log("Truncating federal restrictions table...");
      // Truncate the federal restrictions table before the insert of the new data.
      await this.federalRestrictionService.resetFederalRestrictionsTable(
        entityManager,
      );
      // Get the existing federal restrictions codes.
      const federalRestrictionsCodesMap =
        await this.getFederalRestrictionsCodesMap(entityManager);
      // Temporary array to keep the records to be inserted in batch.
      const sanitizedRestrictions: FedRestrictionFileRecord[] = [];
      // Stream the file content and process the records line by line to avoid memory issues.
      // Insert the records considered sanitized.
      await this.integrationService.streamResponseFileRecords(
        remoteFilePath,
        async (record, progress) => {
          // Callback to process each line of the file, validating the data and preparing it to be inserted in batch.
          const invalidDataMessage = record.getInvalidDataMessage();
          if (invalidDataMessage) {
            const errorMessage = `Found record with invalid data at line number ${record.lineNumber}: ${invalidDataMessage}`;
            processSummary.warn(errorMessage);
            this.logger.error(errorMessage);
            // Exit the callback without inserting the record if the data is invalid,
            // but keep processing the next lines of the file.
            return;
          }
          sanitizedRestrictions.push(record);
          if (
            sanitizedRestrictions.length >=
            FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT
          ) {
            const insertFederalRestrictionsBulkPromise =
              await this.insertFederalRestrictionsBulk(
                entityManager,
                sanitizedRestrictions,
                federalRestrictionsCodesMap,
                processSummary,
              );
            const progressPromise = await processSummary.progress?.(progress);
            await Promise.all([
              insertFederalRestrictionsBulkPromise,
              progressPromise,
            ]);
            sanitizedRestrictions.length = 0;
          }
        },
      );
      // Insert the remaining records that were not inserted in the bulk insert inside the stream,
      // because they did not reach the amount defined for the bulk insert.
      if (sanitizedRestrictions.length) {
        await this.insertFederalRestrictionsBulk(
          entityManager,
          sanitizedRestrictions,
          federalRestrictionsCodesMap,
          processSummary,
        );
      }
      this.logger.log(
        "Completed file download and record insertion into the Federal Restrictions table.",
      );
    } catch (error) {
      const errorMessage = `Error while downloading and inserting records into the Federal Restrictions table, file ${remoteFilePath}.`;
      processSummary.error(errorMessage, error);
      this.logger.error(errorMessage, error);
      return;
    }
  }

  /**
   * Insert a bulk of federal restrictions records from the received data into the DB.
   * The records are converted to DB objects and then inserted in batches.
   * @param restrictions federal restrictions records from the file to be inserted.
   * @param federalRestrictionRepo repository to execute the inserts in batches that
   * keeps the DB operations in the same transaction.
   */
  private async insertFederalRestrictionsBulk(
    entityManager: EntityManager,
    restrictions: FedRestrictionFileRecord[],
    federalRestrictionsCodesMap: Map<string, number>,
    processSummary: ProcessSummary,
  ): Promise<void> {
    const [firstLine] = restrictions;
    const lastLine = restrictions[restrictions.length - 1];
    await this.ensureFederalRestrictionExists(
      entityManager,
      restrictions,
      federalRestrictionsCodesMap,
      processSummary,
    );
    // DB restriction objects to be inserted to the DB.
    const restrictionsToInsert: FederalRestriction[] = [];
    for (const restriction of restrictions) {
      const composedCode = restriction.getComposedCode();
      const restrictionId = federalRestrictionsCodesMap.get(composedCode);
      if (!restrictionId) {
        throw new Error(
          `Restriction code ${composedCode} not found for line number ${restriction.lineNumber}. This record should have been created on the previous step.`,
        );
      }
      const newRestriction = new FederalRestriction();
      newRestriction.lastName = restriction.surname;
      newRestriction.sin = restriction.sin;
      // The insert of federal restriction always comes from an external source through integration.
      // Hence birth date is parsed as date object from external source as their date format
      // may not be necessarily ISO date format.
      newRestriction.birthDate = getISODateOnlyString(restriction.dateOfBirth);
      newRestriction.restriction = { id: restrictionId } as Restriction;
      restrictionsToInsert.push(newRestriction);
    }
    try {
      await entityManager
        .getRepository(FederalRestriction)
        .insert(restrictionsToInsert);
    } catch (error: unknown) {
      const logMessage = `Error while inserting the block of lines from ${firstLine.lineNumber} to ${lastLine.lineNumber}.`;
      throw new Error(logMessage, { cause: error });
    }
  }

  /**
   * Ensure that all the federal restrictions received on the file have their corresponding restriction record on the system.
   * There is a pretty low expectation that new restriction codes will be received on the file, but if that happens, this method
   * will create the new restriction records with the information available and log the new codes created.
   * @param entityManager entity manager to use for the database operations.
   * @param restrictions federal restrictions records from the file to be checked if they have their corresponding restriction record on the system.
   * @param federalRestrictionsCodesMap map with the existing federal restriction codes on the system to be checked against the received records.
   * @param processSummary process summary for logging the new created restrictions if some new code is received on the file.
   */
  private async ensureFederalRestrictionExists(
    entityManager: EntityManager,
    restrictions: FedRestrictionFileRecord[],
    federalRestrictionsCodesMap: Map<string, number>,
    processSummary: ProcessSummary,
  ): Promise<void> {
    const missingCodes: string[] = [];
    for (const restriction of restrictions) {
      const composedCode = restriction.getComposedCode();
      if (!federalRestrictionsCodesMap.has(composedCode)) {
        missingCodes.push(composedCode);
      }
    }
    if (!missingCodes.length) {
      return;
    }
    // Add new codes to database.
    const createdRestrictions =
      await this.restrictionService.createUnidentifiedFederalRestriction(
        missingCodes,
        entityManager,
      );
    // Update the map with the new created restrictions.
    createdRestrictions.forEach((restriction) =>
      federalRestrictionsCodesMap.set(
        restriction.restrictionCode,
        restriction.id,
      ),
    );
    // Log the new created restrictions codes.
    // The warning will generate a system alert to allow human intervention if needed.
    const logMessage = `New restrictions created: ${createdRestrictions
      .map((r) => r.restrictionCode)
      .join(", ")}`;
    processSummary.warn(logMessage);
    this.logger.warn(logMessage);
  }

  /**
   * Get a snapshot of the current federal restrictions on the system.
   * These code are unique and are used to identify the restrictions received from the file
   * and detected is some new federal restriction was received and needs to be created on the
   * system before the insert of the federal restrictions records.
   * @param entityManager entity manager to use for the database operations.
   * @returns map of federal restriction codes to their corresponding IDs.
   */
  private async getFederalRestrictionsCodesMap(
    entityManager: EntityManager,
  ): Promise<Map<string, number>> {
    const federalRestrictions = await entityManager
      .getRepository(Restriction)
      .find({
        select: { id: true, restrictionCode: true },
        where: {
          restrictionType: RestrictionType.Federal,
        },
      });
    return new Map<string, number>(
      federalRestrictions.map((restriction) => [
        restriction.restrictionCode,
        restriction.id,
      ]),
    );
  }
}
