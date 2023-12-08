import { User } from "@sims/sims-db";

/**
 * Parses e-Cert record information.
 */
export abstract class ECertRecordParser {
  /**
   * Record type.
   */
  abstract get recordType(): string;

  /**
   * Student's first name.
   */
  abstract get firstName(): string;

  /**
   * Student's last name.
   */
  abstract get lastName(): string;

  /**
   * Validate if the first name and last names belongs to the
   * provided student user.
   * @param user user to be checked.
   * @returns true if the users first name and last name matches.
   */
  hasUser(user: Pick<User, "firstName" | "lastName">): boolean {
    return user.lastName === this.lastName && user.firstName === this.firstName;
  }
}
