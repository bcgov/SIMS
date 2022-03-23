import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { DesignationAgreementStatus } from "@/types/contracts/DesignationAgreementContract";

export function useDesignationAgreementLocation() {
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
