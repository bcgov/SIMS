import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";

import { StudentDetail } from "@sims/integrations/services/sfas";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASFileLineBuilder } from "@sims/integrations/sfas-integration/sims-sfas-files/sims-to-sfas-file-line-builder";

@Injectable()
export class SIMSToSFASIntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Create SIMS to SFAS file content.
   * @param bridgeFileDate date when the bridge file data was extracted.
   * @returns SIMS to SFAS file content.
   */
  createSIMSToSFASFileContent(
    bridgeFileDate: Date,
    studentRecords: StudentDetail[],
  ): FixedFormatFileLine[] {
    return new SIMSToSFASFileLineBuilder()
      .appendHeader(bridgeFileDate)
      .appendStudentFileRecords(studentRecords)
      .appendFooter().fileLines;
    // TODO: SIMS to SFAS - Append applications, restrictions and footer.
  }
}
