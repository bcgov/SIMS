import * as dayjs from "dayjs";

/**
 * Max allowed first name and last name length.
 */
const MAX_NAME_LENGTH = 30;

const SPACE_FILLER = " ";

export const DATE_FORMAT = "YYYYMMDD";

export const CRA_PROGRAM_AREA_CODE = "BCSL";

/**
 * Parses CRA income request record information.
 */
export class CRARequestRecordParser {
  /**
   * Initializes a new CRA income request parser.
   * @param record record to be parsed.
   */
  constructor(private readonly record: string) {}

  /**
   * Student's first name.
   */
  get firstName(): string {
    return this.record.substring(51, 51 + MAX_NAME_LENGTH);
  }

  /**
   * Student's last name.
   */
  get lastName(): string {
    return this.record.substring(21, 21 + MAX_NAME_LENGTH);
  }

  /**
   * Validate if the first name and last names belongs to the
   * provided individual.
   * @param firstName first name to be checked.
   * @param lastName last name to be checked.
   * @returns true if the individual's first name and last name matches.
   */
  matchIndividual(lastName: string, firstName?: string): boolean {
    return (
      this.getNameWithFiller(lastName) === this.lastName &&
      this.getNameWithFiller(firstName) === this.firstName
    );
  }

  /**
   * Check if the record matches the provided data.
   * @param incomeData object containing the individual's income data.
   * - `id` CRA income verification ID.
   * - `firstName` individual's first name.
   * - `lastName` individual's last name.
   * - `sin` individual's Social Insurance Number (SIN).
   * - `birthDate` individual's birth date.
   * - `taxYear` individual's tax year for the income verification.
   * @returns true if the record matches the provided data, false otherwise.
   */
  matchIncome(incomeData: {
    id: number;
    firstName: string;
    lastName: string;
    sin: string;
    birthDate: string;
    taxYear: number;
  }): boolean {
    const formattedBirthDate = dayjs(incomeData.birthDate).format(DATE_FORMAT);
    const freeProjectArea = `VERIFICATION_ID:${incomeData.id}`.padEnd(
      30,
      SPACE_FILLER,
    );
    const formattedLastName = this.getNameWithFiller(incomeData.lastName);
    const formattedFirstName = this.getNameWithFiller(incomeData.firstName);
    const expectedRecord = `7101${incomeData.sin}    0020${formattedLastName}${formattedFirstName}${formattedBirthDate}${incomeData.taxYear}                ${CRA_PROGRAM_AREA_CODE}${freeProjectArea}   0`;
    return expectedRecord === this.record;
  }

  /**
   * Recreates the header data from the provided {@link headerData} object
   * and compares it with the record.
   * @param headerData object containing the header data to be matched.
   * - `fileDate` date of the file.
   * - `sequenceNumber` sequence number of the file.
   * @returns true if the header data matches the record, false otherwise.
   */
  matchHeader(headerData: { fileDate: Date; sequenceNumber: number }): boolean {
    const date = dayjs(headerData.fileDate).format(DATE_FORMAT);
    const sequence = headerData.sequenceNumber.toString().padStart(5, "0");
    const expectedString = `7100                        ${date} ${CRA_PROGRAM_AREA_CODE}A${sequence}                                                                                                   0`;
    return expectedString === this.record;
  }

  /**
   * Recreates the footer data from the provided {@link footerData} object
   * and compares it with the record.
   * @param footerData object containing the footer data to be matched.
   * - `fileDate` date of the file.
   * - `sequenceNumber` sequence number of the file.
   * - `totalRecords` total number of records in the file.
   * @returns true if the footer data matches the record, false otherwise.
   */
  matchFooter(footerData: {
    fileDate: Date;
    sequenceNumber: number;
    totalRecords: number;
  }): boolean {
    const date = dayjs(footerData.fileDate).format(DATE_FORMAT);
    const sequence = footerData.sequenceNumber.toString().padStart(5, "0");
    const recordsCount = footerData.totalRecords.toString().padStart(8, "0");
    const expectedString = `7102                        ${date} ${CRA_PROGRAM_AREA_CODE}A${sequence}      ${recordsCount}                                                                                     0`;
    return expectedString === this.record;
  }

  /**
   * Pads the provided name with spaces to ensure it meets the maximum length requirement
   * in the same way it is expected to be presented in the CRA request record.
   * @param name first or last name to be padded.
   * @returns name in the expected format for CRA request record.
   */
  private getNameWithFiller(name?: string): string {
    return (name ?? "")
      .padEnd(MAX_NAME_LENGTH, SPACE_FILLER)
      .substring(0, MAX_NAME_LENGTH);
  }
}
