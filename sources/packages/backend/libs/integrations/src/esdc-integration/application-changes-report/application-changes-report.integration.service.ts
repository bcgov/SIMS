import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { Injectable } from "@nestjs/common";
import { unparse } from "papaparse";
import { END_OF_LINE, getPSTPDTDateTime } from "@sims/utilities";
import {
  Application,
  OfferingIntensity,
  StudentScholasticStandingChangeType,
} from "@sims/sims-db";
import {
  ApplicationChangesReport,
  ApplicationChangesReportHeaders,
} from "./models/application-changes-report-integration.model";
const ISO_DATE_TIME_FORMAT = "YYYY-MM-DDTHH:mm:ss";
@Injectable()
export class ApplicationChangesReportIntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }

  /**
   * Create application changes report file content.
   * @param applicationChanges application changes.
   * @param remoteFilePath remote file path.
   * @returns application changes report file content.
   */
  createApplicationChangesReportFileContent(
    applicationChanges: Application[],
  ): string {
    const applicationChangesReportDetails = applicationChanges.map(
      (applicationChange) =>
        this.transformToApplicationChangesReport(applicationChange),
    );
    const reportCSVContent = unparse<ApplicationChangesReport>({
      fields: Object.values(ApplicationChangesReportHeaders),
      data: applicationChangesReportDetails,
    });
    const fileContent = reportCSVContent
      .concat(END_OF_LINE)
      .concat(`Number of records: ${applicationChanges.length}`);
    console.log(fileContent);
    return fileContent;
  }

  /**
   * Transform to application changes report format.
   * @param application application change.
   * @returns application changes report.
   */
  private transformToApplicationChangesReport(
    application: Application,
  ): ApplicationChangesReport {
    const student = application.student;
    const currentAssessment = application.currentAssessment;
    const currentOffering = currentAssessment.offering;
    const previousOffering =
      currentAssessment.previousDateChangedReportedAssessment.offering;
    const scholasticStandingChange =
      currentAssessment.studentScholasticStanding;
    return {
      "Application Number": application.applicationNumber,
      "Student SIN": student.sinValidation.sin,
      "Student First Name": student.user.firstName,
      "Student Last Name": student.user.lastName,
      "Loan Type":
        currentOffering.offeringIntensity === OfferingIntensity.fullTime
          ? "FT"
          : "PT",
      "Education Institution Code":
        currentOffering.institutionLocation.institutionCode,
      "Original Study Start Date": previousOffering.studyStartDate,
      "Original Study End Date": previousOffering.studyEndDate,
      Activity:
        scholasticStandingChange?.changeType ===
        StudentScholasticStandingChangeType.StudentWithdrewFromProgram
          ? "Early Withdrawal"
          : "Reassessment",
      "Activity Time": getPSTPDTDateTime(currentAssessment.createdAt, {
        dateTimeFormat: ISO_DATE_TIME_FORMAT,
      }),
      "New Study Start Date": currentOffering.studyStartDate,
      "New Study End Date": currentOffering.studyEndDate,
    };
  }
}
