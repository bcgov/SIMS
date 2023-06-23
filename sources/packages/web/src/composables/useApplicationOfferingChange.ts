import {
  ApplicationOfferingChangeRequestStatus,
  StatusChipTypes,
} from "@/types";

export function useApplicationOfferingChange() {
  const mapApplicationOfferingChangeChipStatus = (
    status: ApplicationOfferingChangeRequestStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationOfferingChangeRequestStatus.Approved:
        return StatusChipTypes.Success;
      case ApplicationOfferingChangeRequestStatus.InProgressWithSABC:
        return StatusChipTypes.Warning;
      case ApplicationOfferingChangeRequestStatus.InProgressWithStudent:
        return StatusChipTypes.Warning;
      case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
        return StatusChipTypes.Error;
      case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapApplicationOfferingChangeChipStatus };
}
