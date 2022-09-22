import { StatusChipTypes } from "@/components/generic/StatusChip.models";
import {
  ApplicationDetailHeader,
  ApplicationStatus,
  OfferingIntensity,
} from "@/types";

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
    return {
      "Application #": application.applicationNumber,
      Institution: application.applicationInstitutionName,
      "Study dates":
        application.applicationStartDate && application.applicationEndDate
          ? `${application.applicationStartDate} - ${application.applicationEndDate}`
          : "-",
      Type: application.applicationOfferingIntensity,
    };
  };

  return { mapApplicationChipStatus, mapApplicationDetailHeader };
}
