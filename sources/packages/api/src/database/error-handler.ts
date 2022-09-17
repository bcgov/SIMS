import { QueryFailedError } from "typeorm";

/**
 * Database constraints and indexes that must be used to further verifications.
 */
export enum DatabaseConstraintNames {
  /**
   * Ensures offerings in "Approved" or "Creation pending" statuses
   * does not have the same name, study start, and study end dates for
   * a specific location and program.
   * Applied on table sims.education_programs_offerings.
   */
  LocationIDProgramIDOfferingNameStudyDatesIndex = "location_id_program_id_offering_name_study_dates_index",
  /**
   * Ensures error code is unique for a disbursement receipt.
   * Applied on table disbursement_feedback_errors.
   */
  DisbursementScheduleIDErrorCodeUnique = "disbursement_schedule_id_error_code_unique",
}

/**
 * Common query failed errors with additional Postgres
 * specific properties.
 */
export interface PostgresDriverError extends QueryFailedError {
  constraint: DatabaseConstraintNames;
}
