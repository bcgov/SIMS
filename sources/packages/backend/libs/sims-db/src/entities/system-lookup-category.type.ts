/**
 * System lookup category.
 */
export enum SystemLookupCategory {
  /**
   * Countries listed in the system.
   */
  Country = "Country",
  /**
   * Canada provinces and territories.
   */
  Province = "Province",
  /**
   * Student disability related lookup categories, such as Physical, Sensory, Cognitive, etc.
   */
  DisabilityCategory = "Disability category",
  /**
   * Designations related to a disability, such as Permanent, Persistent or Prolonged.
   */
  DisabilityType = "Disability type",
  /**
   * Specific impairments related to a disability, such as Visual, Hearing, Mobility, etc.
   */
  DisabilityImpairment = "Disability impairment",
  /**
   * Category which consists of program length lookup values.
   */
  ProgramLength = "Program length",
  /**
   * Category which consists of institution regulatory body lookup values.
   */
  InstitutionRegulatoryBody = "Institution regulatory body",
  /**
   * Category which consists of program entrance requirement lookup values.
   */
  ProgramEntranceRequirement = "Program entrance requirement",
  /**
   * Category which consists of program aviation credential lookup values.
   */
  ProgramAviationCredential = "Program aviation credential",
}
