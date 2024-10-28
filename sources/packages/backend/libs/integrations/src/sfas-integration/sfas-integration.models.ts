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
  //TODO: SIMS to SFAS - Add the records sent for applications and restrictions.
  uploadedFileName: string;
}

/**
 * All the students who are going to be processed
 * in the SIMS to SFAS integration due to one or more
 * updates in either their student or student related data, application or application
 * related data or restriction or restriction related data.
 */
export class SIMSToSFASStudents {
  private readonly studentIds: number[] = [];
  /**
   * Append the student ids.
   * @param studentIds student ids
   * @returns instance of the class for further appending.
   */
  append(studentIds: number[]): this {
    this.studentIds.push(...studentIds);
    return this;
  }

  /**
   * Unique student ids of all the students who are going to be processed
   * in the SIMS to SFAS integration.
   * @returns unique student ids.
   */
  getUniqueStudentIds(): number[] {
    return [...new Set(this.studentIds)];
  }
}

/**
 * Format of the timestamp in the uploaded file name for SIMS to SFAS.
 */
export const SIMS_TO_SFAS_FILE_NAME_TIMESTAMP_FORMAT = "YYYYMMDD-HHmmss";

/**
 * Record type codes for SIMS to SFAS.
 */
export enum SIMSToSFASRecordTypeCodes {
  Header = "100",
  StudentDataRecord = "200",
  FullTimeApplicationDataRecord = "300",
  PartTimeApplicationDataRecord = "301",
  RestrictionDataRecord = "400",
  Footer = "999",
}
