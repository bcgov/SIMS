import {
  LoggerService,
  InjectLogger,
  ProcessSummary,
} from "@sims/utilities/logger";
import { Injectable } from "@nestjs/common";
import { FedRestrictionIntegrationService } from "./fed-restriction.integration.service";
import { DataSource, Repository } from "typeorm";
import { FederalRestriction, Restriction } from "@sims/sims-db";
import { getISODateOnlyString, processInParallel } from "@sims/utilities";
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
   * @param processSummary process summary for logging.
   * @returns process response.
   */
  async process(processSummary: ProcessSummary): Promise<void> {
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

    if (filePaths.length > 0) {
      // Process only the most updated file.
      await this.processAllRestrictions(
        filePaths[filePaths.length - 1],
        auditUser.id,
        processSummary,
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
  private async processAllRestrictions(
    remoteFilePath: string,
    auditUserId: number,
    processSummary: ProcessSummary,
  ): Promise<void> {
    processSummary.info(`Processing file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    let downloadResult: FedRestrictionFileRecord[];
    try {
      // Download the Federal Restrictions file with the full snapshot of the data.
      downloadResult = await this.integrationService.downloadResponseFile(
        remoteFilePath,
      );
      this.logger.log("File download finished.");
    } catch (error) {
      const errorMessage = `Error downloading file ${remoteFilePath}.`;
      processSummary.error(errorMessage, error);
      this.logger.error(errorMessage, error);
      return;
    }

    let insertedRestrictionsIDs: number[];
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
          processSummary.warn(errorMessage);
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
        processSummary.warn(logMessage);
        this.logger.warn(logMessage);
      }

      this.logger.log("Truncating federal restrictions table...");
      await this.federalRestrictionService.resetFederalRestrictionsTable(
        queryRunner.manager,
      );

      this.logger.log("Starting bulk insert...");
      // Created the bulks to be inserted at the same time.
      const fedRestrictionsBulks = this.getFedRestrictionsBulks(
        sanitizedRestrictions,
      );
      // Insert the bulks in parallel.
      try {
        await processInParallel(
          (fedRestrictionsBulk) =>
            this.insertFedRestrictionsBulk(
              fedRestrictionsBulk,
              federalRestrictions.restrictions,
              federalRestrictionRepo,
            ),
          fedRestrictionsBulks,
          {
            progress: (currentBulk) => {
              this.logger.log(
                `Inserted record bulk ${currentBulk} of ${fedRestrictionsBulks.length}.`,
              );
            },
          },
        );
      } catch (error: unknown) {
        const logMessage =
          "Aborting process due to an error on the bulk insert.";
        this.logger.error(logMessage, error);
        throw new Error(logMessage, { cause: error });
      }

      this.logger.log("Bulk data insert finished.");
      this.logger.log(
        "Starting bulk operations to update student restrictions.",
      );
      insertedRestrictionsIDs =
        await this.federalRestrictionService.executeBulkStepsChanges(
          queryRunner.manager,
        );
      await queryRunner.commitTransaction();
      this.logger.log("Process finished, transaction committed.");
    } catch (error) {
      const logMessage =
        "Unexpected error while processing federal restrictions. Executing rollback.";
      this.logger.error(logMessage, error);
      await queryRunner.rollbackTransaction();
      throw new Error(logMessage, { cause: error });
    } finally {
      await queryRunner.release();
    }
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
   * Splits the given array of federal restrictions records into
   * bulks to allow a batch insert. The bulk size is defined by the constant
   * {@link FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT}.
   * @param restrictions federal restrictions records read from the file.
   * @returns bulks of federal restrictions records.
   */
  private getFedRestrictionsBulks(
    restrictions: FedRestrictionFileRecord[],
  ): FedRestrictionFileRecord[][] {
    const bulkRestrictions: FedRestrictionFileRecord[][] = [];
    while (restrictions.length > 0) {
      const restrictionsToBulkInsert = restrictions.splice(
        0,
        FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT,
      );
      bulkRestrictions.push(restrictionsToBulkInsert);
    }
    return bulkRestrictions;
  }

  /**
   * Insert a bulk of federal restrictions records from the received data into the DB.
   * The records are converted to DB objects and then inserted in batches.
   * @param restrictions federal restrictions records from the file to be inserted.
   * @param federalRestrictionsCodes list of existing federal restriction codes expected
   * in the file record to be used to determine the restriction ID in the DB.
   * @param federalRestrictionRepo repository to execute the inserts in batches that
   * keeps the DB operations in the same transaction.
   */
  private async insertFedRestrictionsBulk(
    restrictions: FedRestrictionFileRecord[],
    federalRestrictionsCodes: Restriction[],
    federalRestrictionRepo: Repository<FederalRestriction>,
  ): Promise<void> {
    // DB restriction objects to be inserted to the db.
    const restrictionsToInsert: FederalRestriction[] = [];
    for (const restriction of restrictions) {
      const codeToFind = restriction.getComposedCode();
      const restrictionRecord = federalRestrictionsCodes.find(
        (fedRestriction) => fedRestriction.restrictionCode == codeToFind,
      );
      const newRestriction = new FederalRestriction();
      newRestriction.lastName = restriction.surname;
      newRestriction.sin = restriction.sin;
      // The insert of federal restriction always comes from an external source through integration.
      // Hence birth date is parsed as date object from external source as their date format
      // may not be necessarily ISO date format.
      newRestriction.birthDate = getISODateOnlyString(restriction.dateOfBirth);
      newRestriction.restriction = restrictionRecord;
      restrictionsToInsert.push(newRestriction);
    }
    try {
      await federalRestrictionRepo.insert(restrictionsToInsert);
    } catch (error: unknown) {
      const [firstLine] = restrictions;
      const lastLine = restrictions[restrictions.length - 1];
      const logMessage = `Error while inserting the block of lines from ${firstLine.lineNumber} to ${lastLine.lineNumber}.`;
      throw new Error(logMessage, { cause: error });
    }
  }

  @InjectLogger()
  logger: LoggerService;
}
