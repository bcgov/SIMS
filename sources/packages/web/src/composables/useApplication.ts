import {
  ApplicationDetailHeader,
  ApplicationEditStatus,
  ApplicationStatus,
  OfferingIntensity,
  StatusChipTypes,
} from "@/types";
import { useFormatters } from "@/composables/useFormatters";

export function useApplication() {
  const mapApplicationChipStatus = (
    status: ApplicationStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationStatus.Completed:
        return StatusChipTypes.Success;
      case ApplicationStatus.InProgress:
      case ApplicationStatus.Assessment:
      case ApplicationStatus.Enrolment:
        return StatusChipTypes.Warning;
      case ApplicationStatus.Cancelled:
        return StatusChipTypes.Error;
      case ApplicationStatus.Draft:
      case ApplicationStatus.Submitted:
        return StatusChipTypes.Default;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  const mapApplicationDetailHeader = (
    application: Required<ApplicationDetailHeader>,
  ): Record<string, OfferingIntensity | string> => {
    const { dateOnlyLongString } = useFormatters();
    let studyDates;
    if (application.applicationStartDate && application.applicationEndDate) {
      studyDates = `${dateOnlyLongString(
        application.applicationStartDate,
      )} - ${dateOnlyLongString(application.applicationEndDate)}`;
    } else if (
      application.data.studystartDate &&
      application.data.studyendDate
    ) {
      studyDates = `${dateOnlyLongString(
        application.data.studystartDate,
      )} - ${dateOnlyLongString(application.data.studyendDate)}`;
    }

    return {
      "Application #": application.applicationNumber ?? "-",
      Institution: application.applicationInstitutionName ?? "-",
      "Study dates": studyDates ?? "-",
      Type: application.applicationOfferingIntensity ?? "-",
    };
  };

  /**
   * Application edit status targeting students.
   * @param editStatus application edit status.
   * @returns student friendly edit status.
   */
  const mapApplicationEditStatusForStudents = (
    editStatus: ApplicationEditStatus,
  ): string => {
    switch (editStatus) {
      case ApplicationEditStatus.ChangeDeclined:
        return "Declined";
      case ApplicationEditStatus.ChangeCancelled:
        return "Cancelled";
      case ApplicationEditStatus.ChangedWithApproval:
        return "Changed";
      default:
        return editStatus;
    }
  };

  return {
    mapApplicationChipStatus,
    mapApplicationDetailHeader,
    mapApplicationEditStatusForStudents,
  };
}
