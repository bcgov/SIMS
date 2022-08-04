import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ProgramInfoStatus } from "@/types";

export function usePIR() {
  const mapPIRChipStatus = (status: ProgramInfoStatus): StatusChipTypes => {
    switch (status) {
      case ProgramInfoStatus.completed:
        return StatusChipTypes.Success;
      case ProgramInfoStatus.required:
        return StatusChipTypes.Warning;
      case ProgramInfoStatus.declined:
        return StatusChipTypes.Error;
      case ProgramInfoStatus.submitted:
        return StatusChipTypes.Default;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapPIRChipStatus };
}
