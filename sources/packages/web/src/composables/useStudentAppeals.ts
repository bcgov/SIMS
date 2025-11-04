export function useStudentAppeals() {
  /**
   * Maps known student appeals form names to more user-friendly versions.
   * @param formName original form name.
   * @returns user-friendly form name.
   */
  const mapStudentAppealsFormNames = (formName: string): string => {
    switch (formName.toLowerCase()) {
      case "roomandboardcostsappeal":
        return "Room and board costs";
      case "modifiedindependentappeal":
        return "Modified independent";
      default:
        return formName;
    }
  };

  return { mapStudentAppealsFormNames };
}
