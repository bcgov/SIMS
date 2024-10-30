/**
 * Util to get the list of database field names
 * with relation
 * respective to users dataTable field name
 * that need to be sorted.
 * @param fieldName
 * @returns fieldName
 */
export const sortUsersColumnMap = (fieldName: string): [] => {
  const userSortOptions = {
    displayName: ["user.firstName", "user.lastName"],
    email: ["user.email"],
    userType: ["authType.type"],
    role: ["authType.role"],
    location: ["location.name"],
    isActive: ["user.isActive"],
  };
  return userSortOptions[fieldName] ?? [];
};

/**
 * Util to get the list of database field names
 * with relation
 * respective to application dataTable field name
 * that need to be sorted.
 * When a new sort need to be implemented,
 * Add dataTable field name as its respective database
 * column name
 * @param fieldName
 * @returns fieldName
 */
export const sortApplicationsColumnMap = (fieldName: string): string => {
  const applicationSortOptions = {
    applicationNumber: "application.applicationNumber",
  };
  return applicationSortOptions[fieldName] ?? null;
};
/**
 * Util to get the list of database field
 * with respective to program offering dataTable
 * field names that need to be sorted.
 * When a new sort need to be implemented,
 * Add dataTable field name as its respective database
 * @param fieldName
 * @returns fieldName
 */
export const sortOfferingsColumnMap = (fieldName: string): string => {
  const offeringSortOptions = {
    name: "offerings.name",
  };
  return offeringSortOptions[fieldName] ?? null;
};

/**
 * Util to get the list of database field
 * with respective to program summary dataTable
 * field names that need to be sorted.
 * When a new sort need to be implemented,
 * Add dataTable field name as its respective database
 * @param fieldName
 * @returns fieldName
 */
export const sortProgramsColumnMap = (fieldName: string): string => {
  const programSortOptions = {
    submittedDate: "programs.createdAt",
    programName: "programs.name",
    credentialType: "programs.credentialType",
    locationName: "location.name",
  };
  return programSortOptions[fieldName] ?? null;
};
