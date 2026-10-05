/**
 * Returned loans response record type.
 */
export enum ReturnedLoansResponseRecordType {
  Header = "00",
  AddressDetail = "20",
  ReturnedLoanDetail = "30",
  Footer = "99",
}

/**
 * Detail record types in the returned loans response.
 */
export const DETAIL_RECORD_TYPES = [
  ReturnedLoansResponseRecordType.AddressDetail,
  ReturnedLoansResponseRecordType.ReturnedLoanDetail,
];

/**
 * Date format used in the returned loans response file.
 * Official document states the format as CCYYMMDD which corresponds to YYYYMMDD.
 */
export const DATE_FORMAT = "YYYYMMDD";
