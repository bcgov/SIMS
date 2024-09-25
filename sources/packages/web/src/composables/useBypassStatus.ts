import { ApplicationRestrictionBypassStatus } from "@/services/http/dto";
import { StatusChipTypes } from "@/types";

export function useBypassStatus() {
  const mapBypassStatus = (
    status: ApplicationRestrictionBypassStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationRestrictionBypassStatus.Active:
        return StatusChipTypes.Success;
      case ApplicationRestrictionBypassStatus.Removed:
        return StatusChipTypes.Inactive;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapBypassStatus };
}
