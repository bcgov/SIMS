import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  ApplicationDetailHeader,
  ApplicationStatus,
  OfferingIntensity,
} from "@/types";
import { useFormatters } from "@/composables/useFormatters";

export function useApplication() {
  const mapApplicationChipStatus = (
    status: ApplicationStatus,
  ): StatusChipTypes => {
    switch (status) {
      case ApplicationStatus.completed:
        return StatusChipTypes.Success;
      case ApplicationStatus.inProgress:
      case ApplicationStatus.assessment:
      case ApplicationStatus.enrollment:
        return StatusChipTypes.Warning;
      case ApplicationStatus.cancelled:
        return StatusChipTypes.Error;
      case ApplicationStatus.draft:
      case ApplicationStatus.submitted:
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
      "Application #": application.applicationNumber,
      Institution: application.applicationInstitutionName,
      "Study dates": studyDates,
      Type:
        application.applicationOfferingIntensity ??
        application.data.howWillYouBeAttendingTheProgram,
    };
  };
  return { mapApplicationChipStatus, mapApplicationDetailHeader };
}
