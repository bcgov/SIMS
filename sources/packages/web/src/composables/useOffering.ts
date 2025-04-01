import { OfferingIntensity, OfferingStatus, StatusChipTypes } from "@/types";

export function useOffering() {
  const mapOfferingChipStatus = (status: OfferingStatus): StatusChipTypes => {
    switch (status) {
      case OfferingStatus.Approved:
        return StatusChipTypes.Success;
      case OfferingStatus.CreationPending:
      case OfferingStatus.ChangeUnderReview:
        return StatusChipTypes.Warning;
      case OfferingStatus.CreationDeclined:
      case OfferingStatus.ChangeDeclined:
        return StatusChipTypes.Error;
      default:
        return StatusChipTypes.Inactive;
    }
  };

  /**
   * Maps the offering intensity to an user friendly string representation.
   * @param offeringIntensity intensity of the offering.
   * @returns user friendly string representation of the offering intensity.
   */
  const mapOfferingIntensity = (
    offeringIntensity: OfferingIntensity,
  ): string => {
    switch (offeringIntensity) {
      case OfferingIntensity.partTime:
        return "Part-time";
      case OfferingIntensity.fullTime:
        return "Full-time";
      default:
        return "Unknown";
    }
  };

  /**
   * Maps the offering intensities to an user friendly string representation.
   * @param allowFullTime flag to allow full time offering intensity.
   * @returns user friendly string representations of the offering intensities.
   */
  const mapOfferingIntensities = (
    allowFullTime = true,
  ): Partial<Record<OfferingIntensity, string>> => {
    if (allowFullTime) {
      return {
        [OfferingIntensity.fullTime]: mapOfferingIntensity(
          OfferingIntensity.fullTime,
        ),
        [OfferingIntensity.partTime]: mapOfferingIntensity(
          OfferingIntensity.partTime,
        ),
      };
    }
    return {
      [OfferingIntensity.partTime]: mapOfferingIntensity(
        OfferingIntensity.partTime,
      ),
    };
  };

  return { mapOfferingChipStatus, mapOfferingIntensities };
}
