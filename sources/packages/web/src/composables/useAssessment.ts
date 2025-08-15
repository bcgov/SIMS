import {
  ApplicationExceptionStatus,
  StudentAppealStatus,
  StudentAssessmentStatus,
  AssessmentDetailHeader,
  StatusChipTypes,
  StatusChipLabelTypes,
  ApplicationOfferingChangeRequestStatus,
  OfferingStatus,
} from "@/types";

export function useAssessment() {
  const mapRequestAssessmentChipStatus = (
    status:
      | StudentAppealStatus
      | ApplicationExceptionStatus
      | ApplicationOfferingChangeRequestStatus
      | OfferingStatus,
  ): StatusChipTypes => {
    switch (status) {
      case StudentAppealStatus.Approved:
      case ApplicationExceptionStatus.Approved:
      case ApplicationOfferingChangeRequestStatus.Approved:
      case OfferingStatus.Approved:
        return StatusChipTypes.Success;
      case StudentAppealStatus.Pending:
      case ApplicationExceptionStatus.Pending:
      case ApplicationOfferingChangeRequestStatus.InProgressWithStudent:
      case ApplicationOfferingChangeRequestStatus.InProgressWithSABC:
      case OfferingStatus.CreationPending:
      case OfferingStatus.ChangeUnderReview:
        return StatusChipTypes.Warning;
      case StudentAppealStatus.Declined:
      case ApplicationExceptionStatus.Declined:
      case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
      case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
      case OfferingStatus.CreationDeclined:
      case OfferingStatus.ChangeDeclined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapRequestAssessmentChipStatusLabel = (
    status:
      | StudentAppealStatus
      | ApplicationExceptionStatus
      | ApplicationOfferingChangeRequestStatus
      | OfferingStatus,
  ): StatusChipLabelTypes | string => {
    switch (status) {
      case StudentAppealStatus.Approved:
      case ApplicationExceptionStatus.Approved:
      case ApplicationOfferingChangeRequestStatus.Approved:
      case OfferingStatus.Approved:
        return StatusChipLabelTypes.Completed;
      case StudentAppealStatus.Pending:
      case ApplicationExceptionStatus.Pending:
      case ApplicationOfferingChangeRequestStatus.InProgressWithStudent:
      case ApplicationOfferingChangeRequestStatus.InProgressWithSABC:
      case OfferingStatus.CreationPending:
      case OfferingStatus.ChangeUnderReview:
        return StatusChipLabelTypes.Pending;
      case StudentAppealStatus.Declined:
      case ApplicationExceptionStatus.Declined:
      case ApplicationOfferingChangeRequestStatus.DeclinedByStudent:
      case ApplicationOfferingChangeRequestStatus.DeclinedBySABC:
      case OfferingStatus.CreationDeclined:
      case OfferingStatus.ChangeDeclined:
        return StatusChipLabelTypes.Declined;
      default:
        return status;
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

  /**
   * Map living category codes to their display names.
   * @param livingCategoryCode living category code
   * @param placeholder placeholder text
   * @returns display name or placeholder
   */
  const mapLivingCategory = (
    livingCategoryCode: string | undefined,
    placeholder = "Not applicable",
  ): string | undefined => {
    if (!livingCategoryCode) {
      return placeholder;
    }
    switch (livingCategoryCode) {
      case "M":
        return "Married";
      case "SP":
        return "Single parent";
      case "SIA":
        return "Single away from home or Single at home paying rent";
      case "SIH":
        return "Single living at home";
      case "SDA":
        return "Single away from home or Single at home paying rent";
      case "SDH":
        return "Single living at home";
      default:
        return livingCategoryCode;
    }
  };

  /**
   * Map student dependent status codes to their display names.
   * @param studentStatusCode student dependent status code
   * @param placeholder placeholder text
   * @returns display name or placeholder
   */
  const mapStudentStatus = (
    studentStatusCode: string | undefined,
    placeholder = "Not applicable",
  ): string | undefined => {
    if (!studentStatusCode) {
      return placeholder;
    }
    switch (studentStatusCode) {
      case "independant":
        return "Independent";
      case "dependant":
        return "Dependant";
      default:
        return studentStatusCode;
    }
  };

  return {
    mapRequestAssessmentChipStatus,
    mapRequestAssessmentChipStatusLabel,
    mapAssessmentHistoryChipStatus,
    mapAssessmentDetailHeader,
    mapAssessmentHistoryChipLabel,
    mapLivingCategory,
    mapStudentStatus,
  };
}
