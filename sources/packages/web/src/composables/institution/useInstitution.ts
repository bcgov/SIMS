import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
} from "@/types";

export function useInstitution() {
  /**
   * Get regulatory body to display.
   * @param regulatoryBody regulatory body value.
   * @returns regulatory body to display.
   */
  const getRegulatoryBodyToDisplay = (regulatoryBody: string): string => {
    const regulatoryBodyToDisplayMapping: Record<string, string> = {
      "private-act": "Private Act of BC Legislature",
      icbc: "ICBC",
      dqab: "DQAB",
      ptiru: "PTIRU",
      skilledTradesBC: "Skilled Trades BC",
      senateOrEducationCouncil: "Senate or Education Council",
      other: "Other",
    };
    return regulatoryBodyToDisplayMapping[regulatoryBody] || regulatoryBody;
  };

  /**
   * Get institution classification to display.
   * @param classification institution classification value.
   * @returns institution classification to display.
   */
  const getClassificationToDisplay = (
    classification: InstitutionClassification,
  ): string => {
    const classificationToDisplayMapping: Record<
      InstitutionClassification,
      string
    > = {
      [InstitutionClassification.Public]: "Public",
      [InstitutionClassification.Private]: "Private",
    };
    return classificationToDisplayMapping[classification] || classification;
  };

  /**
   * Get organization status to display.
   * @param organizationStatus organization status value.
   * @returns organization status to display.
   */
  const getOrganizationStatusToDisplay = (
    organizationStatus: InstitutionOrganizationStatus,
  ): string => {
    const organizationStatusToDisplayMapping: Record<
      InstitutionOrganizationStatus,
      string
    > = {
      [InstitutionOrganizationStatus.Profit]: "Profit",
      [InstitutionOrganizationStatus.NotForProfit]: "Not for Profit",
    };
    return (
      organizationStatusToDisplayMapping[organizationStatus] ||
      organizationStatus
    );
  };

  /**
   * Get medical school status to display.
   * @param medicalSchoolStatus medical school status value.
   * @returns medical school status to display.
   */
  const getMedicalSchoolStatusToDisplay = (
    medicalSchoolStatus: InstitutionMedicalSchoolStatus,
  ): string => {
    const medicalSchoolStatusToDisplayMapping: Record<
      InstitutionMedicalSchoolStatus,
      string
    > = {
      [InstitutionMedicalSchoolStatus.Yes]: "Yes",
      [InstitutionMedicalSchoolStatus.No]: "No",
    };
    return (
      medicalSchoolStatusToDisplayMapping[medicalSchoolStatus] ||
      medicalSchoolStatus
    );
  };
  return {
    getRegulatoryBodyToDisplay,
    getClassificationToDisplay,
    getOrganizationStatusToDisplay,
    getMedicalSchoolStatusToDisplay,
  };
}
