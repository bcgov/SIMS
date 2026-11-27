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
   * Program credential type lookup values.
   */
  ProgramCredentialType = "Program credential type",
  /**
   * Program length lookup values.
   */
  ProgramLength = "Program length",
  /**
   * Institution regulatory body lookup values.
   */
  InstitutionRegulatoryBody = "Institution regulatory body",
  /**
   * Program entrance requirement lookup values.
   */
  ProgramEntranceRequirement = "Program entrance requirement",
  /**
   * Program aviation credential lookup values.
   */
  ProgramAviationCredential = "Program aviation credential",
  /**
   * Underserved communities in BC. This is not an exhaustive list of BC communities.
   */
  UnderservedCommunity = "Underserved community",
  /**
   * Employer categories for the BC Loan Forgiveness application.
   */
  EmployerCategory = "Employer category",
  /**
   * Occupations eligible for the BC Loan Forgiveness when working with children.
   */
  WorksWithChildrenOccupations = "Works with children occupations",
  /**
   * Occupations eligible for the BC Loan Forgiveness when working in underserved communities.
   */
  UnderservedCommunityOccupations = "Underserved community occupations",
}
