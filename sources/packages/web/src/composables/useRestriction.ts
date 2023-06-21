import { RestrictionStatus, StatusChipTypes } from "@/types";

export function useRestriction() {
  const mapRestrictionChipStatus = (
    status: RestrictionStatus,
  ): StatusChipTypes => {
    switch (status) {
      case RestrictionStatus.Resolved:
        return StatusChipTypes.Success;
      case RestrictionStatus.Active:
        return StatusChipTypes.Warning;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapRestrictionChipStatus };
}
