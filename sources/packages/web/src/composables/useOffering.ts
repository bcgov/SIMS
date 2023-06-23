import { OfferingStatus, StatusChipTypes } from "@/types";

export function useOffering() {
  const mapOfferingChipStatus = (status: OfferingStatus): StatusChipTypes => {
    switch (status) {
      case OfferingStatus.Approved:
        return StatusChipTypes.Success;
      case OfferingStatus.CreationPending:
      case OfferingStatus.ChangeUnderReview:
        return StatusChipTypes.Warning;
      case OfferingStatus.CreationDeclined:
      case OfferingStatus.ChangeDeclined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapOfferingChipStatus };
}
