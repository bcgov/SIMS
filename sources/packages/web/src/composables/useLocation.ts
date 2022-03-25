import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { DesignationAgreementLocationStatus } from "@/types";

export function useLocation() {
  const mapDesignationChipStatus = (
    status: DesignationAgreementLocationStatus,
  ): StatusChipTypes => {
    switch (status) {
      case DesignationAgreementLocationStatus.Designated:
        return StatusChipTypes.Success;
      case DesignationAgreementLocationStatus.NotDesignated:
        return StatusChipTypes.Warning;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapDesignationChipStatus };
}
