import { Injectable } from "@nestjs/common";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { ProcessSummaryResult } from "@sims/integrations/models";

/**
 * Read and process the ECE response files which are
 * downloaded from SFTP location.
 */
@Injectable()
export class ECEResponseProcessingService {
  private readonly institutionIntegrationConfig: InstitutionIntegrationConfig;
  constructor(
    config: ConfigService,
    private readonly integrationService: ECEResponseIntegrationService,
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * Process all the available ECE response files in SFTP location.
   * Once the file is processed, it gets deleted.
   * @returns Process summary.
   */
  async process(): Promise<ProcessSummaryResult[]> {
    // Get the list of all files from SFTP ordered by file name.
    const fileSearch = new RegExp(`CONR_008.TXT`, "i");
    const filePaths = await this.integrationService.getResponseFilesFullPath(
      this.institutionIntegrationConfig.ftpResponseFolder,
      fileSearch,
    );
    const result: ProcessSummaryResult[] = [];
    // TODO: Processing of ECE files to be implemented.
    // This code will be updated.
    for (const filePath of filePaths) {
      result.push({
        summary: [`Reading file ${filePath}`],
        warnings: [],
        errors: [],
      });
    }
    return result;
  }

  @InjectLogger()
  logger: LoggerService;
}
