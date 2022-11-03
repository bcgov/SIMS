import { Injectable } from "@nestjs/common";
import { ConfigService, SshService } from "../../services";
import { IERIntegrationConfig, SFTPConfig } from "../../types";
import { IERFileDetail } from "./ier-file-detail";
import { IERRecord, IERRequestFileLine } from "./models/ier-integration.model";

/**
 * Manages the creation of the content files that needs to be sent
 * to IER request. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class IERIntegrationService {
  private readonly ierConfig: IERIntegrationConfig;
  private readonly ftpConfig: SFTPConfig;

  constructor(config: ConfigService, private readonly sshService: SshService) {
    this.ierConfig = config.getConfig().IERIntegrationConfig;
    this.ftpConfig = config.getConfig().zoneBSFTP;
  }

  /**
   * Create the IER request content, by populating the records.
   * @param ierRecords - Assessment, Student, User, offering,
   * program and application objects data.
   * @returns Complete IERFileLines record as an array.
   */
  createIERRequestContent(ierRecords: IERRecord[]): IERRequestFileLine[] {
    const ierFileLines: IERRequestFileLine[] = [];
    const fileRecords = ierRecords.map((ierRecord) => {
      const ierFileDetail = new IERFileDetail();
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
}
