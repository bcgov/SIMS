import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ApplicationStatus } from "@/types";

export function useApplication() {
  const mapApplicationChipStatus = (
    status: ApplicationStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationStatus.completed:
        return StatusChipTypes.Success;
      case ApplicationStatus.inProgress:
        return StatusChipTypes.Warning;
      case ApplicationStatus.assessment:
        return StatusChipTypes.Warning;
      case ApplicationStatus.enrollment:
        return StatusChipTypes.Warning;
      case ApplicationStatus.cancelled:
        return StatusChipTypes.Error;
      case ApplicationStatus.draft:
        return StatusChipTypes.Default;
      case ApplicationStatus.submitted:
        return StatusChipTypes.Default;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapApplicationChipStatus };
}
