import {
  ProgramDeliveryTypes,
  ProgramDeliveryTypeValues,
  ProgramStatus,
  StatusChipTypes,
} from "@/types";

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

  const mapToProgramDeliveryTypeValues = (
    programDeliveryTypes: ProgramDeliveryTypes,
  ): ProgramDeliveryTypeValues[] =>
    [
      programDeliveryTypes.deliveredOnSite && ProgramDeliveryTypeValues.Onsite,
      programDeliveryTypes.deliveredOnline && ProgramDeliveryTypeValues.Online,
    ].filter((deliveryType): deliveryType is ProgramDeliveryTypeValues =>
      Boolean(deliveryType),
    );

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
    mapToProgramDeliveryTypeValues,
    convertCheckboxObjectModelToArray,
  };
}
