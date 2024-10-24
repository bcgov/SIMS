import { StudentDetail } from "@sims/integrations/services/sfas";
import { FixedFormatFileLine } from "@sims/integrations/services/ssh";
import { SIMSToSFASRecordTypeCodes } from "../sfas-integration.models";
import { SIMSToSFASHeader } from "./sims-to-sfas-header";
import { SIMSToSFASStudentRecord } from "./sims-to-sfas-student-record";
import { DisabilityStatus } from "@sims/sims-db";
import { YNFlag } from "@sims/integrations/models";

export class SIMSToSFASFileLineBuilder {
  private readonly fileLinesInternal: FixedFormatFileLine[] = [];

  /**
   * Append the header record.
   * @param bridgeFileDate date when the bridge file data was extracted.
   */
  appendHeader(bridgeFileDate: Date): this {
    const header = new SIMSToSFASHeader();
    header.recordTypeCode = SIMSToSFASRecordTypeCodes.Header;
    header.originator = "PSFS";
    header.title = "SIMS to SFAS BRIDGE";
    header.creationDate = bridgeFileDate;
    this.fileLinesInternal.push(header);
    return this;
  }
  /**
   * Append student file records.
   * @param studentRecords student records.
   */
  appendStudentFileRecords(studentRecords: StudentDetail[]): this {
    studentRecords.forEach((studentDetail) => {
      const studentFileRecord = new SIMSToSFASStudentRecord();
      studentFileRecord.recordTypeCode =
        SIMSToSFASRecordTypeCodes.StudentDataRecord;
      studentFileRecord.studentId = studentDetail.id;
      studentFileRecord.givenName = studentDetail.user.firstName;
      studentFileRecord.lastName = studentDetail.user.lastName;
      studentFileRecord.birthDate = new Date(studentDetail.birthDate);
      studentFileRecord.sin = studentDetail.sinValidation.sin;
      studentFileRecord.pdStatusFlag =
        studentDetail.disabilityStatus === DisabilityStatus.PD
          ? YNFlag.Y
          : YNFlag.N;
      studentFileRecord.pdStatusEffectiveDate =
        studentDetail.disabilityStatus === DisabilityStatus.PD
          ? studentDetail.disabilityStatusEffectiveDate
          : null;
      studentFileRecord.ppdStatusFlag =
        studentDetail.disabilityStatus === DisabilityStatus.PPD
          ? YNFlag.Y
          : YNFlag.N;
      studentFileRecord.ppdStatusEffectiveDate =
        studentDetail.disabilityStatus === DisabilityStatus.PPD
          ? studentDetail.disabilityStatusEffectiveDate
          : null;
      studentFileRecord.casSupplierNumber =
        studentDetail.casSupplier?.supplierNumber;
      studentFileRecord.casSiteNumber =
        studentDetail.casSupplier?.supplierAddress?.supplierSiteCode;
      studentFileRecord.fullTimeCSLOveraward = studentDetail.cslfOverawardTotal
        ? +studentDetail.cslfOverawardTotal
        : 0;
      studentFileRecord.fullTimeBCSLOveraward = studentDetail.bcslOverawardTotal
        ? +studentDetail.bcslOverawardTotal
        : 0;
      this.fileLinesInternal.push(studentFileRecord);
    });
    return this;
  }
  // TODO: SIMS to SFAS - Create append methods for applications, restrictions and footer.

  get fileLines(): FixedFormatFileLine[] {
    return this.fileLinesInternal;
  }
}
