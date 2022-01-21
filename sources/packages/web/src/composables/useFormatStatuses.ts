import { ApprovalStatus, GeneralStatusForBadge } from "@/types";

export function useFormatStatuses() {
  const getProgramStatusToGeneralStatus = (
    status: ApprovalStatus,
  ): GeneralStatusForBadge | undefined => {
    switch (status) {
      case ApprovalStatus.approved:
        return GeneralStatusForBadge.Approved;
      case ApprovalStatus.pending:
        return GeneralStatusForBadge.Pending;
      case ApprovalStatus.denied:
        return GeneralStatusForBadge.Denied;
      default:
        break;
    }
  };

  return { getProgramStatusToGeneralStatus };
}
