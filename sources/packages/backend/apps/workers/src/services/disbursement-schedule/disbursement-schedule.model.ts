import { SFASApplication } from "@sims/sims-db";

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
   *SFAS application which contains the end date of the student.
   */
  latestSfasApplication: SFASApplication;
}
