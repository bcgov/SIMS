import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  ScholasticStandingStatus,
  StudentAppealStatus,
  AssessmentHistoryStatus,
} from "@/types";

export function useAssessment() {
  const mapRequestAssessmentChipStatus = (
    status: StudentAppealStatus | ScholasticStandingStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAppealStatus.Pending || ScholasticStandingStatus.Pending:
        return StatusChipTypes.Warning;
      case StudentAppealStatus.Declined || ScholasticStandingStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapAssessmentHistoryChipStatus = (
    status: AssessmentHistoryStatus,
  ): StatusChipTypes => {
    switch (status) {
      case AssessmentHistoryStatus.Submitted:
        return StatusChipTypes.Inactive;
      case AssessmentHistoryStatus.InProgress:
        return StatusChipTypes.Warning;
      case AssessmentHistoryStatus.Completed:
        return StatusChipTypes.Success;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapRequestAssessmentChipStatus, mapAssessmentHistoryChipStatus };
}
