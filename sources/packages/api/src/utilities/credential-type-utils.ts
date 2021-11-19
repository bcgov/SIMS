/**
 * Util to get the label of credential type.
 * @param credentialType
 * @returns credentialTypeToDisplay
 */
export const credentialTypeToDisplay = (credentialType: string): string => {
  const credentialTypeMap = {
    undergraduateCertificate: "Undergraduate Certificate",
    undergraduateDiploma: "Undergraduate Diploma",
    undergraduateDegree: "Undergraduate Degree",
    graduateCertificate: "Graduate Certificate",
    graduateDiploma: "Graduate Diploma",
    graduateDegreeOrMasters: "Graduate Degree / Master’s",
    postGraduateOrDoctorate: "Post-Graduate / Doctorate",
    qualifyingStudies: "Qualifying Studies",
  };
  return credentialTypeMap[credentialType] || credentialType;
};
