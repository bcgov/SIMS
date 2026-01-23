import { RestrictionService } from "@/services/RestrictionService";
import { EffectiveRestrictionStatus, RestrictionActionType } from "@/types";
import { ref } from "vue";

interface InstitutionRestriction {
  programId: number;
  locationId: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
}
const institutionRestrictionMap = ref(
  new Map<number | undefined, InstitutionRestriction[]>(),
);
export function useInstitutionRestrictionState() {
  const updateInstitutionRestrictionState = async (institutionId?: number) => {
    const institutionRestrictions =
      await RestrictionService.shared.getActiveInstitutionRestrictions({
        institutionId,
      });
    institutionRestrictionMap.value.set(
      institutionId,
      institutionRestrictions.items.map((item) => ({
        locationId: item.locationId,
        programId: item.programId,
        restrictionCode: item.restrictionCode,
        restrictionActions: item.restrictionActions,
      })),
    );
  };

  /**
   * Check if there are any active restrictions for the given institution.
   * @param institutionId institution id.
   * @returns true if there are any active restrictions for the given institution.
   */
  const hasActiveRestriction = (institutionId?: number) =>
    !!institutionRestrictionMap.value.get(institutionId)?.length;

  /**
   * Get the effective institution restriction status for a location and program.
   * @param locationId location id.
   * @param programId program id.
   * @returns effective restriction status.
   */
  const getEffectiveRestrictionStatus = (
    locationId: number,
    programId: number,
    institutionId?: number,
  ): EffectiveRestrictionStatus => {
    const effectiveRestrictions = institutionRestrictionMap.value
      .get(institutionId)
      ?.filter(
        (institutionRestriction) =>
          institutionRestriction.locationId === locationId &&
          institutionRestriction.programId === programId,
      );
    return {
      hasEffectiveRestriction: !!effectiveRestrictions?.length,
      canCreateOffering: !effectiveRestrictions?.some((effectiveRestriction) =>
        effectiveRestriction.restrictionActions.includes(
          RestrictionActionType.StopOfferingCreate,
        ),
      ),
    };
  };

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionStatus,
  };
}
