import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { StudentRestrictionStatus } from "@/types";

export function useStudentRestriction() {
  const mapStudentRestrictionChipStatus = (
    status: StudentRestrictionStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentRestrictionStatus.noRestriction:
        return StatusChipTypes.Success;
      case StudentRestrictionStatus.restriction:
        return StatusChipTypes.Warning;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapStudentRestrictionChipStatus };
}
