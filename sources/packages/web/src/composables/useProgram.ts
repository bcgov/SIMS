import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ProgramStatus } from "@/types";

export function useProgram() {
  const mapProgramChipStatus = (status: ProgramStatus): StatusChipTypes => {
    switch (status) {
      case ProgramStatus.Approved:
        return StatusChipTypes.Success;
      case ProgramStatus.Pending:
        return StatusChipTypes.Warning;
      case ProgramStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapProgramChipStatus };
}
