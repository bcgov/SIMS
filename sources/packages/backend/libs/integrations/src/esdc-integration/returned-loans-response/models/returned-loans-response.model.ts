import { ReturnedLoansResponseFileAddressDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-address-detail";
import { ReturnedLoansResponseFileDetail } from "../returned-loans-response-files/returned-loans-response-file-detail";
import { ReturnedLoansResponseFileReturnedLoanDetail } from "@sims/integrations/esdc-integration/returned-loans-response/returned-loans-response-files/returned-loans-response-file-returned-loan-detail";

/**
 * Returned loans response record type.
 */
export enum ReturnedLoansResponseRecordType {
  Header = "00",
  AddressDetail = "10",
  ReturnedLoanDetail = "30",
  Footer = "99",
}

/**
 * Date format used in the returned loans response file.
 * Official document states the format as CCYYMMDD which corresponds to YYYYMMDD.
 */
export const RETURNED_LOANS_RESPONSE_DATE_FORMAT = "YYYYMMDD";

/**
 * Returned loans response downloaded file.
 */
export interface ReturnedLoansDownloadResponse {
  addressDetailRecords: ReturnedLoansResponseFileAddressDetail[];
  returnedLoanDetailRecords: ReturnedLoansResponseFileReturnedLoanDetail[];
  unknownRecords: ReturnedLoansResponseFileDetail[];
}

/**
 * Returned loans response processing result.
 */
export interface ReturnedLoansResponseResult {
  receivedFiles: number;
}

export interface ReturnedLoanIndividual {
  sin: string;
  lastName: string;
  initialName: string;
  firstName: string;
  dateOfBirth: Date;
  gender: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  provinceCode: string;
  country: string;
  postalCode: string;
  homePhone: string;
  addressEffectiveDate: Date;
}

export interface ReturnedLoan {
  consolidationDate: Date;
  interestRateType: string;
  fixedInterestRate: number;
  variableInterestSpread: number;
  totalPrincipalOutstanding: number;
  interestOwingFromDate: Date;
  totalInterestOutstanding: number;
  interestOwingToDate: Date;
  returnReason: string;
  returnEventDate: Date;
  debtAcknowledgementDate: Date;
}

export interface IndividualReturnedLoan {
  individual: ReturnedLoanIndividual;
  returnedLoan: ReturnedLoan;
}
