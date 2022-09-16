import { QueryFailedError } from "typeorm";

/**
 * Database constraints and indexes that must be used to further verifications.
 */
export enum DatabaseConstraintNames {
  /**
   * Ensures offering in "Approved" or "Creation pending" statuses
   * does not have the same name, study start, and study end dates.
   */
  OfferingNameStudyStartDateStudyEndDateIndex = "location_id_program_id_offering_name_study_start_date_study_end_date_index",
}

/**
 * Common query failed errors with additional Postgres
 * specific properties.
 */
export interface PostgresDriverError extends QueryFailedError {
  constraint: DatabaseConstraintNames;
}
