import { User } from "@sims/sims-db";

/**
 * e-Cert max allowed first name length.
 * Part-time and full-time uses the same max length.
 */
const MAX_FIRST_NAME_LENGTH = 15;
/**
 * e-Cert max allowed last name length.
 * Part-time and full-time uses the same max length.
 */
const MAX_LAST_NAME_LENGTH = 25;

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
   * Student's gender.
   */
  abstract get gender(): string;

  /**
   * Validate if the first name and last names belongs to the
   * provided student user.
   * @param user user to be checked.
   * @returns true if the users first name and last name matches.
   */
  hasUser(user: Pick<User, "firstName" | "lastName">): boolean {
    return (
      user.lastName.substring(0, MAX_LAST_NAME_LENGTH) === this.lastName &&
      user.firstName?.substring(0, MAX_FIRST_NAME_LENGTH) === this.firstName
    );
  }
}
