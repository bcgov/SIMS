import { QueryFailedError } from "typeorm";

/**
 * Database constraints and indexes that must be used for further verifications.
 */
export enum DatabaseConstraintNames {
  /**
   * Ensures offerings in "Approved" or "Creation pending" statuses
   * and is not a "Scholastic standing" offering type,
   * does not have the same name, study start, study end dates and year of study for
   * a specific location and program.
   * Applied on table sims.education_programs_offerings.
   */
  LocationIDProgramIDOfferingNameStudyDatesYearOfStudyIndex = "loc_id_prog_id_offer_name_study_dts_year_study_index",
  /**
   * Student and balance date unique constraint in sims.student_loan_balances table.
   */
  StudentLoanBalanceDateUniqueConstraint = "student_balance_date",
}

/**
 * Common query failed errors with additional Postgres
 * specific properties.
 */
export interface PostgresDriverError extends QueryFailedError {
  constraint: DatabaseConstraintNames;
}

/**
 * @param error error thrown to be checked.
 * @param constraint contraint name from database to checked.
 * @returns true if error is an instance of {@link QueryFailedError} and constraint name is equal to the passed one.
 */
export function isDatabaseConstraintError(
  error: unknown,
  constraint: DatabaseConstraintNames,
): boolean {
  if (error instanceof QueryFailedError) {
    const postgresError = error as PostgresDriverError;
    if (postgresError.constraint === constraint) {
      return true;
    }
  }
  return false;
}
