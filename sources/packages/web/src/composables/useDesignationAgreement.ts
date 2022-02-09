import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import { DesignationAgreementStatus } from "@/types/contracts/DesignationAgreementContract";

export function useDesignationAgreement() {
  const mapDesignationChipStatus = (
    status: DesignationAgreementStatus,
  ): StatusChipTypes => {
    switch (status) {
      case DesignationAgreementStatus.Approved:
        return StatusChipTypes.Success;
      case DesignationAgreementStatus.Pending:
        return StatusChipTypes.Warning;
      case DesignationAgreementStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapDesignationChipStatus };
}
