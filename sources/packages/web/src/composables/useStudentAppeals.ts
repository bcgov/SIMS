import { StatusChipTypes, StudentAppealStatus } from "@/types";

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

  /**
   * Maps student appeal status to corresponding status chip types.
   * @param status student appeal status.
   * @returns corresponding status chip type.
   */
  const mapStudentAppealChipStatus = (
    status: StudentAppealStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAppealStatus.Approved:
        return StatusChipTypes.Success;
      case StudentAppealStatus.Pending:
        return StatusChipTypes.Warning;
      case StudentAppealStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapStudentAppealsFormNames, mapStudentAppealChipStatus };
}
