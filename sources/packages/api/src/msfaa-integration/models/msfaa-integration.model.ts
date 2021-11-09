import * as dayjs from "dayjs";
export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";
export const MSFAA_SENT_TITLE = "MSFAA SENT";
export const TIME_FORMAT = "HHmm";
export const MSFAA_SENT_STATUS_CODE = "P";
/**
 * Required information to a
 * MSFAA request to be processed.
 */
export interface MSFAARecord {
  id: number;
  msfaaNumber: string;
  sin: string;
  institutionCode: string;
  birthDate: Date;
  surname: string;
  givenName: string;
  gender: string;
  maritalStatus: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
  offeringIntensity: string;
}

/**
 * Result of a file uploaded to SFTP on ZONE B network.
 */
export interface MSFAAUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Represents a single line in a MSFAA file.
 * When implemented in a derived class this
 * interface allow the object to be represented
 * as a formatted fixed string.
 */
export interface MSFAARequestFileLine {
  getFixedFormat(): string;
}

/**
 * Codes used to start all the lines of the files sent to MSFAA.
 */
export enum TransactionCodes {
  MSFAAHeader = "100",
  MSFAADetail = "200",
  MSFAATrailer = "999",
}

/**
 * Codes used to identify the code
 */
export enum TransactionSubCodes {
  Received = "R",
  Cancelled = "C",
}

/**
 * Represents the output of the processing of
 * one MSFAA response file from the. SFTP
 */
export class ProcessSftpResponseResult {
  /**
   * Processing summary for a file.
   */
  processSummary: string[] = [];
  /**
   * Errors found during the processing.
   */
  errorsSummary: string[] = [];
}

/**
 * Represents the parsed content of a file
 * downloaded from the MSFAA SFTP response folder.
 */
export interface MSFAAsFtpResponseFile {
  /**
   * File name. Useful for log.
   */
  fileName: string;
  /**
   * Full file path of the file on the SFTP.
   */
  filePath: string;
  /**
   * Response statuses records present on the file.
   */
  receivedRecords: MSFAAResponseReceivedRecord[];
  /**
   * Total records present on the file.
   */
  cancelledRecords: MSFAAResponseCancelledRecord[];
}

export class MSFAAsResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    this.transactionCode = line.substr(0, 3) as TransactionCodes;
    this.msfaaNumber = line.substr(3, 10);
    this.sin = line.substr(13, 9);
    this.transactionSubCode = line.substr(22, 1) as TransactionSubCodes;
    this.line = line;
    this.lineNumber = lineNumber;
  }

  /**
   * Codes used to start all the lines of the files sent to MSFAA.
   */
  public readonly transactionCode: TransactionCodes;
  /**
   * MSFAA number of the record.
   */
  public readonly msfaaNumber: string;
  /**
   * SIN value that is part of the common record identification.
   */
  public readonly sin: string;
  /**
   * Secondary codes used alongside the records.
   */
  public readonly transactionSubCode: TransactionSubCodes;
  /**
   * Original line read from the MSFAA response file.
   */
  public readonly line: string;
  /**
   * Original line number where this record was present
   * in the MSFAA response file. Useful for log.
   */
  public readonly lineNumber: number;
}

/**
 * MSFAA record received (Trans Sub Code - R) that
 * contains the details of Borrower Signed Date,
 * Service Provider Received Date.
 * This record is part of the details record in the MSFAA
 * response file has been extended from the base
 * MSFAAsResponseRecordIdentification class to have the common
 * values between the received and cancelled records.
 * Please note that the numbers below (e.g. line.substr(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'SLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAResponseReceivedRecord extends MSFAAsResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * Date that the borrower indicated that the MSFAA was Signed
   */
  public get borrowerSignedDate(): Date {
    return dayjs(this.line.substr(23, 8), DATE_FORMAT).toDate();
  }

  /**
   * Date MSFAA was received by/resolved from Canada Post/Kiosk
   */
  public get serviceProviderReceivedDate(): Date {
    return dayjs(this.line.substr(31, 8), DATE_FORMAT).toDate();
  }
}

/**
 * MSFAA record cancelled (Trans Sub Code - C) that
 * contains the details of New Issuing Province and cancelled Date.
 * This record is part of the details record in the MSFAA
 * response file has been extended from the base
 * MSFAAsResponseRecordIdentification class to have the common
 * values between the received and cancelled records.
 * Please note that the numbers below (e.g. line.substr(25, 2))
 * represents the position of the information in a fixed text file format.
 * The documentation about it is available on the document
 * 'SLP-AppendixF2AsReviewed2016-FileLayouts BC Files V3(HAJ-CB EDITS) In ESDC Folder'.
 */
export class MSFAAResponseCancelledRecord extends MSFAAsResponseRecordIdentification {
  constructor(line: string, lineNumber: number) {
    super(line, lineNumber);
  }

  /**
   * New Province code that issued the MSFAA
   */
  public get newIssusingProvince(): string {
    return this.line.substr(48, 2);
  }

  /**
   * Date when the MSFAA was cancelled
   */
  public get cancelledDate(): string {
    return this.line.substr(50, 8);
  }
}
