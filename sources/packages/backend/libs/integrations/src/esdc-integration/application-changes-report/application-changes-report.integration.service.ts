import {
  ApplicationChangesReport,
  SFTPIntegrationBase,
  SshService,
} from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { unparse } from "papaparse";
import { END_OF_LINE } from "@sims/utilities";

@Injectable()
export class ApplicationChangesReportIntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   *
   * @param applicationChanges
   * @param remoteFilePath
   */
  async uploadApplicationChangesReport(
    applicationChanges: ApplicationChangesReport[],
    remoteFilePath: string,
  ) {
    const reportCSVContent =
      unparse<ApplicationChangesReport>(applicationChanges);
    const fileContent = reportCSVContent
      .concat(END_OF_LINE)
      .concat(`Number of records: ${applicationChanges.length}`);
    await this.uploadRawContent(fileContent, remoteFilePath);
  }
}
