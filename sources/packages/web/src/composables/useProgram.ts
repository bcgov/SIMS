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

  /**
   * Converts an object model with boolean values into an array of keys where the value is true.
   * @param objectModel object model with boolean values.
   * @returns An array of keys from the objectModel where the value is true.
   */
  const convertCheckboxObjectModelToArray = <T>(objectModel?: object): T[] => {
    if (!objectModel) {
      return [];
    }
    return Object.entries(objectModel)
      .filter(([, value]) => value)
      .map(([key]) => key as T);
  };

  return {
    mapProgramChipStatus,
    convertCheckboxObjectModelToArray,
  };
}
