import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { ApplicationSholasticStandingStatus } from "@/types";

export function useActiveApplication() {
  const mapActiveApplicationChipStatus = (
    status: ApplicationSholasticStandingStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationSholasticStandingStatus.Completed:
      case ApplicationSholasticStandingStatus.Available:
        return StatusChipTypes.Success;
      case ApplicationSholasticStandingStatus.Unavailable:
        return StatusChipTypes.Inactive;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapActiveApplicationChipStatus };
}
