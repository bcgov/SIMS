import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import {
  ApplicationRecord,
  StudentDetail,
} from "@sims/integrations/services/sfas";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASFileLineBuilder } from "./sims-sfas-files/sims-to-sfas-file-line-builder";
import { StudentRestriction } from "@sims/sims-db";
import { LoggerService } from "@sims/utilities/logger";

@Injectable()
export class SIMSToSFASIntegrationService extends SFTPIntegrationBase<void> {
  constructor(
    config: ConfigService,
    sshService: SshService,
    logger: LoggerService,
  ) {
    super(config.zoneBSFTP, sshService, logger);
  }

  /**
   * Create SIMS to SFAS file content.
   * @param bridgeFileDate date when the bridge file data was extracted.
   * @returns SIMS to SFAS file content.
   */
  createSIMSToSFASFileContent(
    bridgeFileDate: Date,
    studentRecords: StudentDetail[],
    applicationRecords: ApplicationRecord[],
    restrictionRecords: StudentRestriction[],
  ): FixedFormatFileLine[] {
    return new SIMSToSFASFileLineBuilder()
      .appendHeader(bridgeFileDate)
      .appendStudentFileRecords(studentRecords)
      .appendApplicationFileRecords(applicationRecords)
      .appendRestrictionFileRecords(restrictionRecords)
      .appendFooter().fileLines;
  }
}
