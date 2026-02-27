import { FormSubmissionDecisionStatus, StatusChipTypes } from "@/types";

export function useFormSubmission() {
  const mapFormSubmissionDecisionStatus = (
    status: FormSubmissionDecisionStatus,
  ): StatusChipTypes => {
    switch (status) {
      case FormSubmissionDecisionStatus.Approved:
        return StatusChipTypes.Success;
      case FormSubmissionDecisionStatus.Pending:
        return StatusChipTypes.Warning;
      case FormSubmissionDecisionStatus.Declined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };
  return { mapFormSubmissionDecisionStatus };
}
