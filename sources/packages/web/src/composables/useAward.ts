import {
  AWARDS,
  FullTimeAwardTypes,
  PartTimeAwardTypes,
} from "@/constants/award-constants";
import { OfferingIntensity } from "@/types";

/**
 * Composable function for handling award-related logic.
 * @returns An object containing functions for mapping award types to display labels.
 */
export function useAward() {
  /**
   * Maps an award type and offering intensity to a user-friendly display label
   * composed of the award description and its display code,
   * e.g. "Canada Student Grant for Students with Disabilities (CSG-D)".
   * @param awardType the award type code.
   * @param offeringIntensity the offering intensity.
   * @returns the display label for the award, or an empty string if not found.
   */
  const mapAward = (
    awardType: FullTimeAwardTypes | PartTimeAwardTypes | string,
    offeringIntensity: OfferingIntensity | string,
  ): string => {
    const award = AWARDS.find(
      (a) =>
        a.awardType === awardType && a.offeringIntensity === offeringIntensity,
    );
    if (!award) {
      return "";
    }
    return `${award.description} (${award.awardTypeDisplay})`;
  };

  return {
    mapAward,
  };
}
