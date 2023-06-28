import { StatusChipTypes, StudentRestrictionStatus } from "@/types";

export function useStudentRestriction() {
  const mapStudentRestrictionChipStatus = (
    status: StudentRestrictionStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentRestrictionStatus.NoRestriction:
        return StatusChipTypes.Success;
      case StudentRestrictionStatus.Restriction:
        return StatusChipTypes.Warning;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapStudentRestrictionChipStatus };
}
