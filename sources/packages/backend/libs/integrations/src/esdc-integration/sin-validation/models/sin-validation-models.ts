import { SINValidation } from "@sims/sims-db";
import { SINValidationFileHeader } from "../sin-validation-files/sin-validation-file-header";
import { SINValidationFileResponse } from "../sin-validation-files/sin-validation-file-response";

export const DATE_FORMAT = "YYYYMMDD";
export const SPACE_FILLER = " ";
export const NUMBER_FILLER = "0";

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
  birthDate: string;
  gender: string;
}

/**
 * When a SIN validation record is updated the
 * result should contains more information for
 * log purposes, this object allow the return
 * of the updated/created record with additional
 * description of the operation executed.
 */
export interface SINValidationUpdateResult {
  record?: SINValidation;
  operationDescription: string;
}
