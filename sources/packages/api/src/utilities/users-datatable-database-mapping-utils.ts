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
