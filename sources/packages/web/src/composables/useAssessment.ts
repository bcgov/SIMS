import {
  ApplicationExceptionStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
  AssessmentDetailHeader,
  StatusChipTypes,
  StatusChipLabelTypes,
  ApplicationOfferingChangeRequestStatus,
} from "@/types";

export function useAssessment() {
  const mapRequestAssessmentChipStatus = (
    status:
      | StudentAppealStatus
      | ApplicationExceptionStatus
      | ApplicationOfferingChangeRequestStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAppealStatus.Approved:
      case ApplicationExceptionStatus.Approved:
      case ApplicationOfferingChangeRequestStatus.Approved:
        return StatusChipTypes.Success;
      case StudentAppealStatus.Pending:
      case ApplicationExceptionStatus.Pending:
      case ApplicationOfferingChangeRequestStatus.InProgressWithStudent:
      case ApplicationOfferingChangeRequestStatus.InProgressWithSABC:
        return StatusChipTypes.Warning;
      case StudentAppealStatus.Declined:
      case ApplicationExceptionStatus.Declined:
      case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
      case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapRequestAssessmentChipStatusLabel = (
    status:
      | StudentAppealStatus
      | ApplicationExceptionStatus
      | ApplicationOfferingChangeRequestStatus,
  ): StatusChipLabelTypes | string => {
    switch (status) {
      case StudentAppealStatus.Approved:
      case ApplicationExceptionStatus.Approved:
      case ApplicationOfferingChangeRequestStatus.Approved:
        return StatusChipLabelTypes.Completed;
      case StudentAppealStatus.Pending:
      case ApplicationExceptionStatus.Pending:
      case ApplicationOfferingChangeRequestStatus.InProgressWithStudent:
      case ApplicationOfferingChangeRequestStatus.InProgressWithSABC:
        return StatusChipLabelTypes.Pending;
      case StudentAppealStatus.Declined:
      case ApplicationExceptionStatus.Declined:
      case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
      case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
        return StatusChipLabelTypes.Declined;
      case ApplicationOfferingChangeRequestStatus.ChangeAwaitingApproval:
        return ApplicationOfferingChangeRequestStatus.ChangeAwaitingApproval;
      default:
        return "";
    }
  };

  const mapAssessmentHistoryChipStatus = (
    status: StudentAssessmentStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAssessmentStatus.Submitted:
        return StatusChipTypes.Default;
      case StudentAssessmentStatus.Queued:
      case StudentAssessmentStatus.InProgress:
        return StatusChipTypes.Warning;
      case StudentAssessmentStatus.Completed:
        return StatusChipTypes.Success;
      case StudentAssessmentStatus.CancellationRequested:
      case StudentAssessmentStatus.CancellationQueued:
      case StudentAssessmentStatus.Cancelled:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapAssessmentHistoryChipLabel = (
    status: StudentAssessmentStatus,
  ): StudentAssessmentStatus => {
    switch (status) {
      case StudentAssessmentStatus.Submitted:
        return StudentAssessmentStatus.Submitted;
      case StudentAssessmentStatus.InProgress:
      case StudentAssessmentStatus.Queued:
        return StudentAssessmentStatus.InProgress;
      case StudentAssessmentStatus.Completed:
        return StudentAssessmentStatus.Completed;
      case StudentAssessmentStatus.CancellationRequested:
      case StudentAssessmentStatus.CancellationQueued:
      case StudentAssessmentStatus.Cancelled:
        return StudentAssessmentStatus.Cancelled;
      default:
        return status;
    }
  };

  const mapAssessmentDetailHeader = (
    assessment: AssessmentDetailHeader,
  ): Record<string, string> => {
    return {
      "Application #": assessment.applicationNumber,
      Institution: assessment.institutionName,
      "Study dates": `${assessment.offeringStudyStartDate} - ${assessment.offeringStudyEndDate}`,
      Type: assessment.offeringIntensity,
    };
  };

  return {
    mapRequestAssessmentChipStatus,
    mapRequestAssessmentChipStatusLabel,
    mapAssessmentHistoryChipStatus,
    mapAssessmentDetailHeader,
    mapAssessmentHistoryChipLabel,
  };
}
