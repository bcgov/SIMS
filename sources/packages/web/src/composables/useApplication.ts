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
      Type:
        application.applicationOfferingIntensity ??
        application.data.howWillYouBeAttendingTheProgram ??
        "-",
    };
  };

  const mapApplicationEditStatusForStudents = (
    editStatus: ApplicationEditStatus,
  ) => {
    switch (editStatus) {
      case ApplicationEditStatus.ChangedWithApproval:
        return "Changed";
      case ApplicationEditStatus.Edited:
        return "Edited";
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
