import { Injectable } from "@nestjs/common";
import {
  ApplicationService,
  StudentAssessmentService,
} from "@sims/integrations/services";
import { ConfigService, ESDCIntegrationConfig } from "@sims/utilities/config";
import { ProcessSummary } from "@sims/utilities/logger";
import { ApplicationChangesReportIntegrationService } from "./application-changes-report.integration.service";
import { formatDate, StringBuilder } from "@sims/utilities";
import { APPLICATION_CHANGES_REPORT_PREFIX } from "@sims/integrations/constants";
import {
  ApplicationChangesReportProcessingResult,
  APPLICATION_CHANGES_FILE_NAME_TIMESTAMP_FORMAT,
} from "./models/application-changes-report-integration.model";
import { SystemUsersService } from "@sims/services";

@Injectable()
export class ApplicationChangesReportProcessingService {
  private readonly esdcConfig: ESDCIntegrationConfig;
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationChangesReportIntegrationService: ApplicationChangesReportIntegrationService,
    private readonly systemUsersService: SystemUsersService,
    private readonly studentAssessmentService: StudentAssessmentService,
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
      "Retrieving all application changes that have not yet been reported.",
    );
    const applicationChanges =
      await this.applicationService.getDateChangeNotReportedApplications();
    const applicationChangesCount = applicationChanges.length;
    processSummary.info(
      `Found ${applicationChangesCount} application changes.`,
    );
    // Build application changes report CSV file content.
    const fileContent =
      this.applicationChangesReportIntegrationService.createApplicationChangesReportFileContent(
        applicationChanges,
      );
    // Create file name and build file path.
    const reportedDate = new Date();
    const { fileName, remoteFilePath } =
      this.createRequestFileName(reportedDate);
    // Upload the file to SFTP location.
    try {
      await this.applicationChangesReportIntegrationService.uploadRawContent(
        fileContent,
        remoteFilePath,
      );
    } catch (error: unknown) {
      // Translate to friendly error message.
      const errorDescription = `Unexpected error uploading the file ${remoteFilePath} to SFTP.`;
      processSummary.error(errorDescription, error);
      throw new Error(errorDescription, { cause: error });
    }
    processSummary.info(
      `Application changes report with file name ${fileName} has been uploaded successfully.`,
    );
    if (applicationChangesCount) {
      const reportedAssessmentIds = applicationChanges.map(
        (applicationChange) => applicationChange.currentAssessment.id,
      );
      await this.studentAssessmentService.updateReportedDate(
        reportedAssessmentIds,
        reportedDate,
        this.systemUsersService.systemUser.id,
      );
      processSummary.info(
        `Reported date ${reportedDate} has been successfully updated for reported application assessments.`,
      );
    } else {
      processSummary.info(
        "Report date update not required as no application changes are reported.",
      );
    }

    return {
      applicationsReported: applicationChangesCount,
      uploadedFileName: fileName,
    };
  }

  /**
   * Create application changes report file name in expected format.
   * @param reportedDate reported date.
   * @returns application changes report file name and remote file path.
   */
  private createRequestFileName(reportedDate: Date): {
    fileName: string;
    remoteFilePath: string;
  } {
    const fileNameBuilder = new StringBuilder();
    fileNameBuilder.append(this.esdcConfig.environmentCode);
    fileNameBuilder.append(APPLICATION_CHANGES_REPORT_PREFIX);
    fileNameBuilder.append(".");
    fileNameBuilder.append(
      formatDate(reportedDate, APPLICATION_CHANGES_FILE_NAME_TIMESTAMP_FORMAT),
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
