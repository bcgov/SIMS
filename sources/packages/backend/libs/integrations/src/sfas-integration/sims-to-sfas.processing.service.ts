import { Injectable } from "@nestjs/common";
import { SIMSToSFASService } from "../services/sfas";
import {
  SIMSToSFASProcessingResult,
  SIMSToSFASStudents,
} from "./sfas-integration.models";
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
    const simsToSFASStudents = new SIMSToSFASStudents();
    const modifiedSince =
      await this.simsToSFASService.getLatestBridgeFileLogDate();
    if (modifiedSince) {
      processSummary.info(
        `The reference date of latest bridge file log is ${modifiedSince}.`,
      );
    }
    // Set the bridge data extracted date as current date-time
    // before staring to extract the bridge data.
    const bridgeDataExtractedDate = new Date();
    processSummary.info("Get all the students with updates.");
    const studentIds = await this.simsToSFASService.getAllStudentsWithUpdates(
      modifiedSince,
    );
    // Append the students with student and student related data updates.
    simsToSFASStudents.append(studentIds);
    return {
      studentRecordsSent: simsToSFASStudents.uniqueStudentIds.length,
      uploadedFileName: this.ftpSendFolder,
    };
  }
}
