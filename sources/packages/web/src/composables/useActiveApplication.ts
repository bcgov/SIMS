import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ApplicationStatus } from "@/types";

export function useActiveApplication() {
  const mapActiveApplicationChipStatus = (
    status: ApplicationStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationStatus.completed:
      case ApplicationStatus.available:
        return StatusChipTypes.Success;
      case ApplicationStatus.unavailable:
        return StatusChipTypes.Inactive;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapActiveApplicationChipStatus };
}
