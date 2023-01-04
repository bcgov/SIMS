import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService } from "@sims/integrations/services";
import { ConfigService } from "@sims/utilities/config";
import { ECERequestFileDetail } from "./ece-files/ece-file-detail";
import { ECEFileFooter } from "./ece-files/ece-file-footer";
import { ECEFileHeader } from "./ece-files/ece-file-header";
import {
  ECERequestFileLine,
  ECERecord,
  RecordTypeCodes,
} from "./models/ece-integration.model";

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
   * @returns Complete ECERequestFileLines record as an array.
   */
  createECEFileContent(eceRecords: ECERecord[]): ECERequestFileLine[] {
    const processDate = new Date();
    const eceRequestFileLines: ECERequestFileLine[] = [];
    // Header record
    const eceFileHeader = new ECEFileHeader();
    eceFileHeader.transactionCode = RecordTypeCodes.ECEHeader;
    eceFileHeader.processDate = processDate;
    eceRequestFileLines.push(eceFileHeader);
    const fileRecords = eceRecords.map((eceRecord) => {
      const eceRequestFileDetail = new ECERequestFileDetail();
      eceRequestFileDetail.applicationNumber = eceRecord.applicationNumber;
      eceRequestFileDetail.assessmentId = eceRecord.assessmentId;
      eceRequestFileDetail.applicationNumber = eceRecord.applicationNumber;
      eceRequestFileDetail.sin = eceRecord.sin;
      eceRequestFileDetail.studentLastName = eceRecord.studentLastName;
      eceRequestFileDetail.studentGivenName = eceRecord.studentGivenName;
      eceRequestFileDetail.birthDate = eceRecord.birthDate;
      eceRequestFileDetail.programName = eceRecord.programName;
      eceRequestFileDetail.programDescription = eceRecord.programDescription;
      eceRequestFileDetail.credentialType = eceRecord.credentialType;
      eceRequestFileDetail.cipCode = eceRecord.cipCode;
      eceRequestFileDetail.nocCode = eceRecord.nocCode;
      eceRequestFileDetail.sabcCode = eceRecord.sabcCode;
      eceRequestFileDetail.institutionProgramCode =
        eceRecord.institutionProgramCode;
      eceRequestFileDetail.programLength = eceRecord.programLength;
      eceRequestFileDetail.studyStartDate = eceRecord.studyStartDate;
      eceRequestFileDetail.studyEndDate = eceRecord.studyEndDate;
      eceRequestFileDetail.tuitionFees = eceRecord.tuitionFees;
      eceRequestFileDetail.programRelatedCosts = eceRecord.programRelatedCosts;
      eceRequestFileDetail.mandatoryFees = eceRecord.mandatoryFees;
      eceRequestFileDetail.exceptionExpenses = eceRecord.exceptionExpenses;
      eceRequestFileDetail.totalFundedWeeks = eceRecord.totalFundedWeeks;
      eceRequestFileDetail.disbursementSchedules =
        eceRecord.disbursementSchedules;
      return eceRequestFileDetail;
    });
    eceRequestFileLines.push(...fileRecords);

    // Footer or Trailer record
    const eceFileFooter = new ECEFileFooter();
    eceFileFooter.transactionCode = RecordTypeCodes.ECETrailer;
    eceFileFooter.recordCount = fileRecords.length;
    eceRequestFileLines.push(eceFileFooter);

    return eceRequestFileLines;
  }
}
