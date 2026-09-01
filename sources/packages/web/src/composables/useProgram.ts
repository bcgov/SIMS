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

  return { mapProgramChipStatus, mapToProgramDeliveryTypeValues };
}
