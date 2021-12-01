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
import { Connection, InsertResult, Repository } from "typeorm";
import { FederalRestriction, Restriction } from "../../database/entities";
import { FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT } from "../../utilities";

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

  async process(): Promise<void> {
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

    if (filePaths.length > 0) {
      // Process only the most updated file.
      await this.processAllRestrictions(filePaths.pop());
      // If there are more than one file, delete it.
      // Only the most updated file matters because it represents the entire data snapshot.
      for (const remoteFilePath of filePaths) {
        await this.integrationService.deleteFile(remoteFilePath);
      }
    }

    //return results;
  }

  private async processAllRestrictions(remoteFilePath: string): Promise<void> {
    const restrictions = await this.integrationService.downloadResponseFile(
      remoteFilePath,
    );

    const federalRestrictionCodes =
      await this.restrictionService.getAllFederalRestrictions();

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const federalRestrictionRepo =
      queryRunner.manager.getRepository(FederalRestriction);
    const restrictionRepo = queryRunner.manager.getRepository(Restriction);

    await this.federalRestrictionService.resetFederalRestrictionsTable(
      queryRunner.manager,
    );

    // Used to limit the number of asynchronous operations
    // that will start at the same time.
    //const maxPromisesAllowed = os.cpus().length;
    const maxPromisesAllowed = 1;
    // Hold all the promises that must be processed.
    const promises: Promise<InsertResult>[] = [];
    while (restrictions.length > 0) {
      // DB restriction objects to be inserted to the db.
      const restrictionsToInsert: FederalRestriction[] = [];
      // Restrictions retrieved from the import file.
      // Insert a certain amount every time.
      const restrictionsToBulkInsert = restrictions.splice(
        0,
        FEDERAL_RESTRICTIONS_BULK_INSERT_AMOUNT,
      );
      for (const restriction of restrictionsToBulkInsert) {
        const newRestriction = new FederalRestriction();
        newRestriction.lastName = restriction.surname;
        newRestriction.sin = restriction.sin;
        newRestriction.birthDate = restriction.dateOfBirth;
        newRestriction.restriction = await this.ensureFederalRestrictionExists(
          restriction.restrictionCode,
          restriction.restrictionReasonCode,
          federalRestrictionCodes,
          restrictionRepo,
        );
        restrictionsToInsert.push(newRestriction);
      }

      promises.push(federalRestrictionRepo.insert(restrictionsToInsert));
      if (promises.length >= maxPromisesAllowed) {
        // Waits for all to be processed.
        await Promise.allSettled(promises);
        // Clear the array.
        promises.splice(0, promises.length);
      }
    }

    // Waits for all to be processed.
    await Promise.allSettled(promises);

    // !This bulk update MUST happen before the next operations to assign
    // !the student foreign keys correctly.
    await this.federalRestrictionService.bulkUpdateStudentsForeignKey(
      queryRunner.manager,
    );
    // This bulk updates expects that the student foreign key is updated.
    await this.federalRestrictionService.bulkInsertNewRestrictions(
      queryRunner.manager,
    );
    await this.federalRestrictionService.bulkDeactivateRestrictions(
      queryRunner.manager,
    );
    // This last update is not critical but allows the system to keep track
    // of the last time that an active restriction was received.
    await this.federalRestrictionService.bulkUpdateActiveRestrictions(
      queryRunner.manager,
    );

    await queryRunner.commitTransaction();
  }

  private async ensureFederalRestrictionExists(
    restrictionCode: string,
    restrictionReasonCode: string,
    federalRestrictions: Restriction[],
    externalRepo?: Repository<Restriction>,
  ): Promise<Restriction> {
    const code = `${restrictionCode}${restrictionReasonCode}`.trim();
    const foundRestriction = federalRestrictions.find(
      (restriction) => restriction.restrictionCode === code,
    );
    if (foundRestriction) {
      return foundRestriction;
    }

    const newRestriction =
      await this.restrictionService.createUnidentifiedFederalRestriction(
        code,
        externalRepo,
      );
    // Updates the current array to allow the new restriction to be reused.
    federalRestrictions.push(newRestriction);
    return newRestriction;
  }

  @InjectLogger()
  logger: LoggerService;
}
