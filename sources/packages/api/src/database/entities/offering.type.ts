/**
 * Possible types for an offering (Education Program Offering).
 */
export enum OfferingTypes {
  /**
   * Offering is available for all the students.
   */
  public = "Public",
  /**
   * Offering was created to fulfill the need of
   * a particular student/application.
   */
  Private = "Private",
  /**
   * Offering created for a change in scholastic standing reported by institution.
   */
  ScholasticStanding = "Scholastic Standing",
}
