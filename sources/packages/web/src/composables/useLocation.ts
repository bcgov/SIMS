import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { DesignationAgreementStatus } from "@/types";

export function useLocation() {
  const mapDesignationChipStatus = (
    status: DesignationAgreementStatus,
  ): StatusChipTypes => {
    switch (status) {
      case DesignationAgreementStatus.Designated:
        return StatusChipTypes.Success;
      case DesignationAgreementStatus.NotDesignated:
        return StatusChipTypes.Warning;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapDesignationChipStatus };
}
