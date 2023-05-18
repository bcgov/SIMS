import { Injectable } from "@nestjs/common";
import * as path from "path";
import { LoggerService, InjectLogger } from "@sims/utilities/logger";
import { ECEResponseIntegrationService } from "./ece-response.integration.service";
import {
  ConfigService,
  InstitutionIntegrationConfig,
} from "@sims/utilities/config";
import { ProcessSummaryResult } from "@sims/integrations/models";
import { ECE_RESPONSE_FILE_NAME } from "@sims/integrations/constants";
import { InstitutionLocationService } from "@sims/integrations/services";

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
    private readonly institutionLocationService: InstitutionLocationService,
  ) {
    this.institutionIntegrationConfig = config.institutionIntegration;
  }

  /**
   * Process all the available ECE response files in SFTP location.
   * Once the file is processed, it gets deleted.
   * @returns Process summary.
   */
  async process(): Promise<ProcessSummaryResult[]> {
    const integrationEnabledInstitutions =
      await this.institutionLocationService.getAllIntegrationEnabledInstitutionCodes();
    const filePaths = integrationEnabledInstitutions.map((institutionCode) =>
      path.join(
        this.institutionIntegrationConfig.ftpResponseFolder,
        institutionCode,
        ECE_RESPONSE_FILE_NAME,
      ),
    );
    const result: ProcessSummaryResult[] = [];
    // TODO: Processing of ECE files to be implemented.
    // This code will be updated.
    for (const filePath of filePaths) {
      const processSummary = await this.processDisbursementsInECEResponseFile(
        filePath,
      );
      result.push(processSummary);
    }
    return result;
  }

  private async processDisbursementsInECEResponseFile(
    remoteFilePath: string,
  ): Promise<ProcessSummaryResult> {
    const processSummary: ProcessSummaryResult = new ProcessSummaryResult();
    processSummary.summary.push(`Reading file ${remoteFilePath}.`);
    this.logger.log(`Starting download of file ${remoteFilePath}.`);
    try {
      const eceFileDetailRecords =
        await this.integrationService.downloadResponseFile(remoteFilePath);
      if (!eceFileDetailRecords.length) {
        processSummary.summary.push(`File ${remoteFilePath} not found.`);
      }
    } catch (error: unknown) {
      this.logger.error(error);
      processSummary.errors.push(
        `Error downloading file ${remoteFilePath}. ${error}`,
      );
    }

    return processSummary;
  }

  @InjectLogger()
  logger: LoggerService;
}
