import { CASInvoiceBatchApprovalStatus, StatusChipTypes } from "@/types";

export function useInvoiceBatchApprovalStatus() {
  const mapInvoiceBatchApprovalStatus = (
    status: CASInvoiceBatchApprovalStatus,
  ): StatusChipTypes => {
    switch (status) {
      case CASInvoiceBatchApprovalStatus.Rejected:
        return StatusChipTypes.Error;
      case CASInvoiceBatchApprovalStatus.Pending:
        return StatusChipTypes.Warning;
      case CASInvoiceBatchApprovalStatus.Approved:
        return StatusChipTypes.Success;
      default:
        return StatusChipTypes.Inactive;
    }
  };
  return { mapInvoiceBatchApprovalStatus };
}
