import { BLOCKED_REASON_MESSAGES } from "@/constants";
import { FormSubmissionConfigurationAPIOutDTO } from "@/services/http/dto";
import {
  FormSubmissionBlockedReason,
  FormSubmissionDecisionStatus,
  StatusChipTypes,
} from "@/types";

export function useFormSubmission() {
  const mapFormSubmissionDecisionStatus = (
    status: FormSubmissionDecisionStatus | null,
  ): StatusChipTypes => {
    switch (status) {
      case FormSubmissionDecisionStatus.Approved:
        return StatusChipTypes.Success;
      case FormSubmissionDecisionStatus.Pending:
        return StatusChipTypes.Warning;
      case FormSubmissionDecisionStatus.Declined:
      case null:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  /**
   * Gets the banner message for the specified blocked reason.
   * @param blockedReason the reason why the form is blocked.
   * @returns the corresponding banner message for the blocked reason, or a default message if not found.
   */
  const getBlockedReasonMessage = (
    blockedReason: FormSubmissionBlockedReason,
  ) => {
    return (
      BLOCKED_REASON_MESSAGES[blockedReason] ??
      "The form is currently blocked from submission."
    );
  };

  /**
   * Checks if any of the selected forms are blocked.
   * @param value array of selected form IDs.
   * @param forms forms available for the current selection.
   * @param message validation message to be returned if any form is blocked.
   * @returns true if none of the selected forms are blocked, otherwise the provided message.
   */
  const checkBlockedSubmissions = (
    value: number[] | undefined,
    forms: FormSubmissionConfigurationAPIOutDTO[],
    message: string,
  ) => {
    if (!value?.length) {
      return true;
    }
    if (forms.some((form) => value.includes(form.id) && !!form.blockedReason)) {
      return message;
    }
    return true;
  };

  return {
    mapFormSubmissionDecisionStatus,
    getBlockedReasonMessage,
    checkBlockedSubmissions,
  };
}
