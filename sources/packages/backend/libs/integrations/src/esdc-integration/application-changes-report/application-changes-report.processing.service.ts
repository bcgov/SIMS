import { Injectable } from "@nestjs/common";
import { ApplicationService } from "@sims/integrations/services";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";
import { DataSource } from "typeorm";
import { ApplicationChangesReportIntegrationService } from "./application-changes-report.integration.service";
import { getPSTPDTDateTime, StringBuilder } from "@sims/utilities";
import { APPLICATION_CHANGES_REPORT_PREFIX } from "@sims/integrations/constants";
import { ApplicationChangesReportProcessingResult } from "./models/application-changes-report-integration.model";

@Injectable()
export class ApplicationChangesReportProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly dataSource: DataSource,
    private readonly applicationService: ApplicationService,
    private readonly applicationChangesReportIntegrationService: ApplicationChangesReportIntegrationService,
    config: ConfigService,
  ) {
    this.esdcConfig = config.esdcIntegration;
  }

  /**
   * Generate application changes report for the applications which has at least one e-Cert sent
   * and the application study dates have changed after the first e-Cert
   * or after the last time the application was reported for study dates change
   * through application changes report. Once generated upload the report to the ESDC directory
   * in SFTP server.
   * @param processSummary process summary.
   * @returns processing result.
   */
  async processApplicationChanges(
    processSummary: ProcessSummary,
  ): Promise<ApplicationChangesReportProcessingResult> {
    processSummary.info(
      "Retrieving all application changes which were not reported already.",
    );
    const applicationChanges =
      await this.applicationService.getDateChangeNotReportedApplications();
    const applicationsReported = applicationChanges.length;
    processSummary.info(`Found ${applicationsReported} application changes.`);
    const fileContent =
      this.applicationChangesReportIntegrationService.createApplicationChangesReportFileContent(
        applicationChanges,
      );
    const { fileName, remoteFilePath } = this.createRequestFileName();
    await this.applicationChangesReportIntegrationService.uploadRawContent(
      fileContent,
      remoteFilePath,
    );
    processSummary.info(
      `Application changes report with file name: ${fileName} has been uploaded successfully.`,
    );
    return {
      applicationsReported,
      uploadedFileName: fileName,
    };
  }

  /**
   * Create application changes report file name.
   * @returns
   */
  private createRequestFileName(): {
    fileName: string;
    remoteFilePath: string;
  } {
    const fileNameBuilder = new StringBuilder();
    fileNameBuilder.append(this.esdcConfig.environmentCode);
    fileNameBuilder.append(APPLICATION_CHANGES_REPORT_PREFIX);
    fileNameBuilder.append(".");
    fileNameBuilder.append(
      getPSTPDTDateTime(new Date(), { dateTimeFormat: "YYYY-MM-DD.HH.mm.ss" }),
    );
    fileNameBuilder.append(".csv");
    const fileName = fileNameBuilder.toString();
    const remoteFilePath = `${this.esdcConfig.ftpRequestFolder}\\${fileName}`;
    return {
      fileName,
      remoteFilePath,
    };
  }
}
