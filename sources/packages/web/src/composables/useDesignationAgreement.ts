import { StatusShipTypes } from "@/components/generic/StatusChip.models";
import { DesignationAgreementStatus } from "@/types/contracts/DesignationAgreementContract";

export function useDesignationAgreement() {
  const mapDesignationChipStatus = (
    status: DesignationAgreementStatus,
  ): StatusShipTypes => {
    switch (status) {
      case DesignationAgreementStatus.Approved:
        return StatusShipTypes.Success;
      case DesignationAgreementStatus.Pending:
        return StatusShipTypes.Warning;
      case DesignationAgreementStatus.Declined:
        return StatusShipTypes.Error;
      default:
        return StatusShipTypes.Inactive;
    }
  };

  return { mapDesignationChipStatus };
}
