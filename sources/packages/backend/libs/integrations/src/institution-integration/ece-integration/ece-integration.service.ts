import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { ECEFileDetail } from "./ece-file-detail";
import { ECEFileLine, ECERecord } from "./models/ece-integration.model";

/**
 * Manages the creation of the content files that needs to be sent
 * to ECE. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class ECEIntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService) {
    super(config.zoneBSFTP, sshService);
  }
  /**
   * Create the ECE request content, by populating the records.
   * @param eceRecords - Assessment, Student, User, offering,
   * program and application objects data.
   * @returns Complete ECEFileLines record as an array.
   */
  createECEFileContent(eceRecords: ECERecord[]): ECEFileLine[] {
    const eceFileLines: ECEFileLine[] = [];
    const fileRecords = eceRecords.map((eceRecord) => {
      const eceFileDetail = new ECEFileDetail();
      eceFileDetail.applicationNumber = eceRecord.applicationNumber;
      eceFileDetail.assessmentId = eceRecord.assessmentId;
      eceFileDetail.applicationNumber = eceRecord.applicationNumber;
      eceFileDetail.sin = eceRecord.sin;
      eceFileDetail.studentLastName = eceRecord.studentLastName;
      eceFileDetail.studentGivenName = eceRecord.studentGivenName;
      eceFileDetail.birthDate = eceRecord.birthDate;
      eceFileDetail.programName = eceRecord.programName;
      eceFileDetail.programDescription = eceRecord.programDescription;
      eceFileDetail.credentialType = eceRecord.credentialType;
      eceFileDetail.cipCode = eceRecord.cipCode;
      eceFileDetail.nocCode = eceRecord.nocCode;
      eceFileDetail.sabcCode = eceRecord.sabcCode;
      eceFileDetail.institutionProgramCode = eceRecord.institutionProgramCode;
      eceFileDetail.programLength = eceRecord.programLength;
      eceFileDetail.studyStartDate = eceRecord.studyStartDate;
      eceFileDetail.studyEndDate = eceRecord.studyEndDate;
      eceFileDetail.tuitionFees = eceRecord.tuitionFees;
      eceFileDetail.programRelatedCosts = eceRecord.programRelatedCosts;
      eceFileDetail.mandatoryFees = eceRecord.mandatoryFees;
      eceFileDetail.exceptionExpenses = eceRecord.exceptionExpenses;
      eceFileDetail.totalFundedWeeks = eceRecord.totalFundedWeeks;
      eceFileDetail.disbursementSchedules = eceRecord.disbursementSchedules;
      return eceFileDetail;
    });
    eceFileLines.push(...fileRecords);
    return eceFileLines;
  }
}
