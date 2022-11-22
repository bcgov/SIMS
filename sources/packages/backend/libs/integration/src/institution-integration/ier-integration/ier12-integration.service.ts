import { Injectable } from "@nestjs/common";
import { SFTPIntegrationBase, SshService1 } from "@sims/integration/services";
import { ConfigService } from "@sims/utilities/config";
import { IER12FileDetail } from "./ier12-file-detail";
import { IER12FileLine, IER12Record } from "./models/ier12-integration.model";

/**
 * Manages the creation of the content files that needs to be sent
 * to IER 12. These files are created based
 * on a fixed size format and uploaded to a SFTP on Government
 * ZONE B network for further processing and final send to servers.
 */
@Injectable()
export class IER12IntegrationService extends SFTPIntegrationBase<void> {
  constructor(config: ConfigService, sshService: SshService1) {
    super(config.zoneBSFTP, sshService);
  }
  /**
   * Create the IER 12 content, by populating the records.
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
      ierFileDetail.disbursementSchedules = ierRecord.disbursementSchedules;
      return ierFileDetail;
    });
    ierFileLines.push(...fileRecords);
    return ierFileLines;
  }
}
