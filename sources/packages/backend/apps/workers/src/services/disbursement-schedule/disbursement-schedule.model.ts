/**
 * Represents the information that must be returned
 * when a SFAS Signed MSFAA is found for the student
 * in SFAS Application.
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

/**
 * Represents the information that contains information if the
 * MSFAA is valid and the MSFAA Number id.
 */
export interface MSFAANumberValid {
  /**
   * MSFAA Number is valid.
   */
  hasValidMSFAANumber: boolean;
  /**
   * MSFAA Number id.
   */
  msfaaNumberId: number;
}
