import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ProgramInfoStatus } from "@/types";

export function useProgramInfoRequest() {
  const mapProgramInfoChipStatus = (
    status: ProgramInfoStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ProgramInfoStatus.completed:
        return StatusChipTypes.Success;
      case ProgramInfoStatus.required:
        return StatusChipTypes.Warning;
      case ProgramInfoStatus.declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapProgramInfoChipStatus };
}
