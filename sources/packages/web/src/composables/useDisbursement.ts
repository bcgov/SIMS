import {
  DisbursementScheduleStatus,
  DisbursementStatusBadgeLabel,
  StatusChipTypes,
} from "@/types";

export function useDisbursement() {
  const mapDisbursementBadgeDetails = (
    status: DisbursementScheduleStatus,
  ): {
    label: DisbursementStatusBadgeLabel;
    status: StatusChipTypes;
    icon?: string;
  } => {
    switch (status) {
      case DisbursementScheduleStatus.Sent:
        return {
          label: DisbursementStatusBadgeLabel.Sent,
          status: StatusChipTypes.Success,
        };
      case DisbursementScheduleStatus.Pending:
      case DisbursementScheduleStatus.ReadyToSend:
        return {
          label: DisbursementStatusBadgeLabel.Pending,
          status: StatusChipTypes.Warning,
          icon: "fa:fa fa-clock-rotate-left",
        };
      case DisbursementScheduleStatus.Cancelled:
      case DisbursementScheduleStatus.Rejected:
        return {
          label: DisbursementStatusBadgeLabel.Cancelled,
          status: StatusChipTypes.Error,
        };
    }
  };
  return {
    mapDisbursementBadgeDetails,
  };
}
