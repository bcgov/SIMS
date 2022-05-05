import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { OfferingStatus } from "@/types";

export function useOffering() {
  const mapOfferingChipStatus = (status: OfferingStatus): StatusChipTypes => {
    switch (status) {
      case OfferingStatus.Approved:
        return StatusChipTypes.Success;
      case OfferingStatus.Pending:
        return StatusChipTypes.Warning;
      case OfferingStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapOfferingChipStatus };
}
