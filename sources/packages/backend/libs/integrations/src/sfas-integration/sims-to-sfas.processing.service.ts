import { Injectable } from "@nestjs/common";
import { SIMSToSFASService } from "../services/sfas";
import { SIMSToSFASProcessingResult } from "./sfas-integration.models";
import { ConfigService } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";

@Injectable()
export class SIMSToSFASProcessingService {
  private readonly ftpSendFolder: string;
  constructor(
    config: ConfigService,
    private readonly simsToSFASService: SIMSToSFASService,
  ) {
    this.ftpSendFolder = config.sfasIntegration.ftpSendFolder;
  }

  async processSIMSUpdates(
    processSummary: ProcessSummary,
  ): Promise<SIMSToSFASProcessingResult> {
    processSummary.info("Process all the SIMS updates.");
    const modifiedSince =
      await this.simsToSFASService.getLatestBridgeFileLogDate();
    if (modifiedSince) {
      processSummary.info(
        `The reference date of latest bridge file log is ${modifiedSince}.`,
      );
    }
    processSummary.info("Get all the students with updates.");
    const studentIds = await this.simsToSFASService.getAllStudentsWithUpdates(
      modifiedSince,
    );
    console.log(studentIds);
    console.log(this.ftpSendFolder);
    return {
      studentRecordsSent: studentIds.length,
      uploadedFileName: this.ftpSendFolder,
    };
  }
}
