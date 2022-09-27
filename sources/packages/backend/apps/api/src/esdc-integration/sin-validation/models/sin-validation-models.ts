import { SINValidation } from "../../../database/entities";
import { SINValidationFileHeader } from "../sin-validation-files/sin-validation-file-header";
import { SINValidationFileResponse } from "../sin-validation-files/sin-validation-file-response";

/**
 * Province code used for ESDC SIN validation.
 */
export const PROVINCE_CODE = "BC";

/**
 * Result of a file uploaded to the SFTP.
 */
export interface SINValidationUploadResult {
  generatedFile: string;
  uploadedRecords: number;
}

/**
 * Result of a file downloaded from the SFTP.
 */
export interface SINValidationResponseResult {
  header: SINValidationFileHeader;
  records: SINValidationFileResponse[];
}

/**
 * Record types for a ESDC SIN Validation file.
 */
export enum RecordTypeCodes {
  Header = "001",
  Record = "002",
  Footer = "999",
}

/**
 * Required personal information to a
 * ESDC SIN validation be processed.
 */
export interface SINValidationRecord {
  sinValidationId: number;
  sin: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  gender: string;
}

/**
 * Possible known types of the SIN check status.
 */
export enum SINCheckStatus {
  /**
   * Passed electronic or manual validation.
   */
  Passed = "1",
  /**
   * Under review.
   */
  UnderReview = "2",
  /**
   * Rejected because SIN is invalid (has not been issued, has been cancelled
   * or has been issued to completely different person).
   */
  RejectedBecauseHasInvalidSIN = "3",
  /**
   * Rejected because SIN and associated data (name, birthdate, gender) are not an
   * exact match. One or all of the associated data items is sufficiently different
   * from what is on the SIN Registry to put the validity in question.
   */
  RejectedBecauseSINAssociatedData = "4",
  /**
   * SIN is being used in a fraudulent manner. At this time, SSB will not
   * actually receive this status.
   */
  Fraud = "5",
}

/**
 * Flag returned from ESDC to indicate the status
 * of certain data that was sent (name, birthdate, gender).
 */
export enum OkayFlag {
  Yes = "Y",
  No = "N",
}

/**
 * When a SIN validation record is updated the
 * result should contains more information for
 * log purposes, this object allow the return
 * of the updated/created record with additional
 * description of the operation executed.
 */
export interface SINValidationUpdateResult {
  record: SINValidation;
  operationDescription: string;
}
