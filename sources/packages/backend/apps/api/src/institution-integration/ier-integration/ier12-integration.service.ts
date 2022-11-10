import { Injectable } from "@nestjs/common";
import * as Client from "ssh2-sftp-client";
import { InjectLogger } from "../../common";
import { LoggerService } from "../../logger/logger.service";
import { ConfigService, SshService } from "../../services";
import { SFTPConfig } from "../../types";
import { IER12FileDetail } from "./ier12-file-detail";
import {
  IER12Record,
  IER12FileLine,
  IER12UploadResult,
} from "./models/ier12-integration.model";

/**
 * Manages the creation of the content files that needs to be sent
 * to IER 12 request. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class IER12IntegrationService {
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  /**
   * Create the IER 12 request content, by populating the records.
   * @param ier12Records - Assessment, Student, User, offering,
   * program and application objects data.
   * @returns Complete IERFileLines record as an array.
   */
  createIER12FileContent(ier12Records: IER12Record[]): IER12FileLine[] {
    const ierFileLines: IER12FileLine[] = [];
    const fileRecords = ier12Records.map((ierRecord) => {
      const ierFileDetail = new IER12FileDetail();
      ierFileDetail.applicationNumber = ierRecord.applicationNumber;
      ierFileDetail.assessmentId = ierRecord.assessmentId;
      ierFileDetail.applicationNumber = ierRecord.applicationNumber;
      ierFileDetail.sin = ierRecord.sin;
      ierFileDetail.studentLastName = ierRecord.studentLastName;
      ierFileDetail.studentGivenName = ierRecord.studentGivenName;
      ierFileDetail.birthDate = ierRecord.birthDate;
      ierFileDetail.programName = ierRecord.programName;
      ierFileDetail.programDescription = ierRecord.programDescription;
      ierFileDetail.credentialType = ierRecord.credentialType;
      ierFileDetail.cipCode = ierRecord.cipCode;
      ierFileDetail.nocCode = ierRecord.nocCode;
      ierFileDetail.sabcCode = ierRecord.sabcCode;
      ierFileDetail.institutionProgramCode = ierRecord.institutionProgramCode;
      ierFileDetail.programLength = ierRecord.programLength;
      ierFileDetail.studyStartDate = ierRecord.studyStartDate;
      ierFileDetail.studyEndDate = ierRecord.studyEndDate;
      ierFileDetail.tuitionFees = ierRecord.tuitionFees;
      ierFileDetail.programRelatedCosts = ierRecord.programRelatedCosts;
      ierFileDetail.mandatoryFees = ierRecord.mandatoryFees;
      ierFileDetail.exceptionExpenses = ierRecord.exceptionExpenses;
      ierFileDetail.totalFundedWeeks = ierRecord.totalFundedWeeks;
      ierFileDetail.courseLoad = ierRecord.courseLoad;
      ierFileDetail.offeringIntensity = ierRecord.offeringIntensity;
      ierFileDetail.disbursementSchedules = ierRecord.disbursementSchedules;
      return ierFileDetail;
    });
    ierFileLines.push(...fileRecords);
    return ierFileLines;
  }

  /**
   * Converts the IERFileLines to the final content and upload it.
   * @param ierFileLines Array of lines to be converted to a formatted fixed size file.
   * @param remoteFilePath Remote location to upload the file (path + file name).
   * @returns Upload result.
   */
  async uploadContent(
    ierFileLines: IER12FileLine[],
    remoteFilePath: string,
  ): Promise<IER12UploadResult> {
    // Generate fixed formatted file.
    const fixedFormattedLines: string[] = ierFileLines.map(
      (line: IER12FileLine) => line.getFixedFormat(),
    );
    const ierFileContent = fixedFormattedLines.join("\r\n");
    // Send the file to ftp.
    this.logger.log("Creating new SFTP client to start upload...");
    const client = await this.getClient();
    try {
      this.logger.log(`Uploading ${remoteFilePath}`);
      await client.put(Buffer.from(ierFileContent), remoteFilePath);
      return {
        generatedFile: remoteFilePath,
        uploadedRecords: ierFileLines.length,
      };
    } finally {
      this.logger.log("Finalizing SFTP client...");
      await SshService.closeQuietly(client);
      this.logger.log("SFTP client finalized.");
    }
  }

  /**
   * Generates a new connected SFTP client ready to be used.
   * @returns client
   */
  private async getClient(): Promise<Client> {
    return this.sshService.createClient(this.ftpConfig);
  }

  @InjectLogger()
  logger: LoggerService;
}
