import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "../../services";
import { FedRestrictionIntegrationService } from "./fed-restriction-integration.service";
import { ESDCIntegrationConfig } from "../../types";
import * as os from "os";
import { FedRestrictionFileRecord } from "./fed-restriction-files/fed-restriction-file-record";

@Injectable()
export class FedRestrictionProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    config: ConfigService,
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
    const restrictionsGrouping =
      await this.integrationService.downloadResponseFile(remoteFilePath);

    // Used to limit the number of asynchronous operations
    // that will start at the same time.
    const maxPromisesAllowed = os.cpus().length;
    // Hold all the promises that must be processed.
    const promises: Promise<void>[] = [];
    for (const [, restrictions] of Object.entries(restrictionsGrouping)) {
      // Since all restrictions are grouped by students, provide all the
      // specific student restrictions to be processed altogether.
      promises.push(this.syncStudentRestrictions(restrictions));
      if (promises.length >= maxPromisesAllowed) {
        // Waits for all to be processed.
        await Promise.allSettled(promises);
        // Clear the array.
        promises.splice(0, promises.length);
      }
    }

    return null;
  }

  /**
   * Receives all restrictions for a specific student (and one
   * student only) to be processed (inserted, updated, deleted).
   * @param studentRestrictions all restrictions for one student.
   */
  private async syncStudentRestrictions(
    studentRestrictions: FedRestrictionFileRecord[],
  ) {
    // Since all restrictions belongs to the same student, we can use
    // one as a reference to retrieve the student data from DB fro sync.
    const refRestriction = studentRestrictions[0];
    console.log(refRestriction.surname);
    console.log(refRestriction.sin);
    console.log(refRestriction.dateOfBirth);
    console.log("+++++++++++++++++++++++++++++++++++++++++++");
  }

  @InjectLogger()
  logger: LoggerService;
}
