import { useFormatters } from "@/composables/useFormatters";
import {
  InstitutionClassification,
  InstitutionMedicalSchoolStatus,
  InstitutionOrganizationStatus,
} from "@/types";

export function useInstitution() {
  const { emptyStringFiller } = useFormatters();
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
   * @returns institution classification to display or an empty string filler.
   */
  const getClassificationToDisplay = (
    classification?: InstitutionClassification,
  ): string => {
    const classificationToDisplayMap = new Map<
      InstitutionClassification | undefined,
      string
    >([
      [InstitutionClassification.Public, "Public"],
      [InstitutionClassification.Private, "Private"],
    ]);
    const result =
      classificationToDisplayMap.get(classification) || classification;
    return emptyStringFiller(result);
  };

  /**
   * Get organization status to display.
   * @param organizationStatus organization status value.
   * @returns organization status to display or an empty string filler.
   */
  const getOrganizationStatusToDisplay = (
    organizationStatus?: InstitutionOrganizationStatus,
  ): string => {
    const organizationStatusToDisplayMap = new Map<
      InstitutionOrganizationStatus | undefined,
      string
    >([
      [InstitutionOrganizationStatus.Profit, "Profit"],
      [InstitutionOrganizationStatus.NotForProfit, "Not for Profit"],
    ]);
    const result =
      organizationStatusToDisplayMap.get(organizationStatus) ||
      organizationStatus;
    return emptyStringFiller(result);
  };

  /**
   * Get medical school status to display.
   * @param medicalSchoolStatus medical school status value.
   * @returns medical school status to display or an empty string filler.
   */
  const getMedicalSchoolStatusToDisplay = (
    medicalSchoolStatus?: InstitutionMedicalSchoolStatus,
  ): string => {
    const medicalSchoolStatusToDisplayMap = new Map<
      InstitutionMedicalSchoolStatus | undefined,
      string
    >([
      [InstitutionMedicalSchoolStatus.Yes, "Yes"],
      [InstitutionMedicalSchoolStatus.No, "No"],
    ]);
    const result =
      medicalSchoolStatusToDisplayMap.get(medicalSchoolStatus) ||
      medicalSchoolStatus;
    return emptyStringFiller(result);
  };
  return {
    getRegulatoryBodyToDisplay,
    getClassificationToDisplay,
    getOrganizationStatusToDisplay,
    getMedicalSchoolStatusToDisplay,
  };
}
