/**
 * Represents the SFAS individual data summary details.
 */
export interface SFASIndividualDataSummary {
  totalUnsuccessfulWeeks: number;
}

/**
 * Represents the information that must be returned
 * when a SFAS Signed MSFAA and latest application end date
 * is found for the student in SFAS Application.
 */
export interface SFASSignedMSFAA {
  /**
   * SFAS MSFAA Number.
   */
  sfasMSFAANumber: string;
  /**
   * Latest SFAS application end date of the student.
   */
  latestSFASApplicationEndDate: string;
}
