import { SFASHeader } from "./sfas-files/sfas-header";
import { SFASRecordIdentification } from "./sfas-files/sfas-record-identification";

export enum RecordTypeCodes {
  Header = "100",
  IndividualDataRecord = "200",
  ApplicationDataRecord = "300",
  PartTimeApplicationDataRecord = "301",
  RestrictionDataRecord = "400",
}

export class DownloadResult {
  header: SFASHeader;
  records: SFASRecordIdentification[];
}

export class ProcessSftpResponseResult {
  summary: string[] = [];
  success: boolean;
}

export interface SIMSToSFASProcessingResult {
  studentRecordsSent: number;
  uploadedFileName: string;
}
/**
 * All the students who are going to be processed
 * in the SIMS to SFAS integration due to one or more
 * updates in either their student or student related data, application or application
 * related data or restriction or restriction related data.
 */
export class SIMSToSFASStudents {
  private studentIds: number[] = [];

  append(studentIds: number[]): void {
    this.studentIds.push(...studentIds);
  }

  /**
   * Unique student ids of all the students who are going to be processed
   * in the SIMS to SFAS integration.
   */
  get uniqueStudentIds(): number[] {
    return [...new Set(this.studentIds)];
  }
}
