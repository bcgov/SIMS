import { ProgramStatus, StatusChipTypes } from "@/types";

export function useProgram() {
  const mapProgramChipStatus = (
    status: ProgramStatus,
    isActive: boolean,
  ): StatusChipTypes => {
    if (!isActive) {
      return StatusChipTypes.Inactive;
    }
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
