import { ApplicationScholasticStandingStatus, StatusChipTypes } from "@/types";

export function useActiveApplication() {
  const mapActiveApplicationChipStatus = (
    status: ApplicationScholasticStandingStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationScholasticStandingStatus.Completed:
      case ApplicationScholasticStandingStatus.Available:
        return StatusChipTypes.Success;
      case ApplicationScholasticStandingStatus.Unavailable:
        return StatusChipTypes.Inactive;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapActiveApplicationChipStatus };
}
