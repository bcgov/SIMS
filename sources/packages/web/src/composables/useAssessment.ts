import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  ScholasticStandingStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
} from "@/types";

export function useAssessment() {
  const mapRequestAssessmentChipStatus = (
    status: StudentAppealStatus | ScholasticStandingStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAppealStatus.Approved:
      case ScholasticStandingStatus.Approved:
        return StatusChipTypes.Success;
      case StudentAppealStatus.Pending:
      case ScholasticStandingStatus.Pending:
        return StatusChipTypes.Warning;
      case StudentAppealStatus.Declined:
      case ScholasticStandingStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapAssessmentHistoryChipStatus = (
    status: StudentAssessmentStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAssessmentStatus.Submitted:
        return StatusChipTypes.Inactive;
      case StudentAssessmentStatus.InProgress:
        return StatusChipTypes.Warning;
      case StudentAssessmentStatus.Completed:
        return StatusChipTypes.Success;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  return { mapRequestAssessmentChipStatus, mapAssessmentHistoryChipStatus };
}
