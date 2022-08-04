import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { COEStatus } from "@/types";

export function useCOE() {
  const mapCOEChipStatus = (status: COEStatus): StatusChipTypes => {
    switch (status) {
      case COEStatus.completed:
        return StatusChipTypes.Success;
      case COEStatus.required:
        return StatusChipTypes.Warning;
      case COEStatus.declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapCOEChipStatus };
}
