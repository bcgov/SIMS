/**
 * Status of a student disability profile, indicating whether it is active, in draft, or archived.
 * Only one active record should exist for a student at any given time.
 * Only a single draft can exist for a student, and it can be promoted to active status when
 * finalized, or soft deleted. Archived profiles are retained for historical reference but are
 * not considered current.
 */
export enum DisabilityProfileStatus {
  /**
   * Profile is current and in use.
   */
  Active = "Active",
  /**
   * Profile is being drafted and has not yet been finalized.
   */
  Draft = "Draft",
  /**
   * Profile has been archived and is retained for historical reference only.
   */
  Archived = "Archived",
}
