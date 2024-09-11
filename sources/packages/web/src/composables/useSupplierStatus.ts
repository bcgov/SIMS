import { SupplierStatus } from "@/services/http/dto";
import { StatusChipTypes } from "@/types";

export function useSupplier() {
  const mapSupplierChipStatus = (status: SupplierStatus): StatusChipTypes => {
    switch (status) {
      case SupplierStatus.PendingAddressVerification:
        return StatusChipTypes.Warning;
      case SupplierStatus.PendingSupplierVerification:
        return StatusChipTypes.Warning;
      case SupplierStatus.Verified:
        return StatusChipTypes.Success;
      case SupplierStatus.VerifiedManually:
        return StatusChipTypes.Success;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapSupplierChipStatus };
}
