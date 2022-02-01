/**
 * Util to get the list of database field names
 * with relation
 * respective to users dataTable field name
 * that need to be sorted.
 * @param fieldName
 * @returns fieldName
 */
export const databaseFieldOfUserDataTable = (fieldName: string): [] => {
  const databaseFieldOfUserDataTableMap = {
    displayName: ["user.firstName", "user.lastName"],
    email: ["user.email"],
    userType: ["authType.type"],
    role: ["authType.role"],
    location: ["location.name"],
    isActive: ["user.isActive"],
  };
  return databaseFieldOfUserDataTableMap[fieldName] ?? [];
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
export const databaseFieldOfApplicationDataTable = (
  fieldName: string,
): string => {
  const databaseFieldOfApplicationDataTableMap = {
    applicationNumber: "application.applicationNumber",
  };
  return databaseFieldOfApplicationDataTableMap[fieldName] ?? null;
};

/**
 * Util to get the list of database fields
 * with respective to institution program dataTable
 * field names that need to be sorted.
 * When a new sort need to be implemented,
 * Add dataTable field name as its respective database
 * @param fieldName
 * @returns fieldName
 */
export const databaseFieldOfInstitutionProgramDataTable = (
  fieldName: string,
): string => {
  const databaseFieldOfInstitutionProgramDataTableMap = {
    approvalStatus: "programs.approvalStatus",
    name: "programs.name",
    credentialType: "programs.credentialType",
  };
  return databaseFieldOfInstitutionProgramDataTableMap[fieldName] ?? null;
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
export const databaseFieldOfOfferingDataTable = (fieldName: string): string => {
  const databaseFieldOfOfferingDataTableMap = {
    name: "offerings.name",
  };
  return databaseFieldOfOfferingDataTableMap[fieldName] ?? null;
};

/**
 * Util to get the list of database field
 * with respective to AEST program summary dataTable
 * field names that need to be sorted.
 * When a new sort need to be implemented,
 * Add dataTable field name as its respective database
 * @param fieldName
 * @returns fieldName
 */
export const databaseFieldOfAESTProgramDataTable = (
  fieldName: string,
): string => {
  const databaseFieldOfProgramDataTableMap = {
    submittedDate: "programs.createdAt",
  };
  return databaseFieldOfProgramDataTableMap[fieldName] ?? null;
};
