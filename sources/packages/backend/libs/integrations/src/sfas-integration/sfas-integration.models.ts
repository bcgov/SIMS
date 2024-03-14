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
  error: string[] = [];
}
