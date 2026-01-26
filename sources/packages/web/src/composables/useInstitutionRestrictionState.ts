import { RestrictionService } from "@/services/RestrictionService";
import { EffectiveRestrictionStatus, RestrictionActionType } from "@/types";
import { computed, ComputedRef, MaybeRefOrGetter, ref, toValue } from "vue";

interface InstitutionRestriction {
  programId: number;
  locationId: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
}
interface Params {
  locationId?: number;
  institutionId?: number;
  programId?: number;
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
   * @param params getter parameters.
   * @returns true if there are any active restrictions for the given institution.
   */
  const hasActiveRestriction = (
    params: MaybeRefOrGetter<Params>,
  ): ComputedRef<boolean> =>
    computed(
      () =>
        !!institutionRestrictionMap.value.get(toValue(params).institutionId)
          ?.length,
    );

  /**
   * Get the effective institution restriction status for a location and program.
   * @param params getter parameters.
   * @returns effective restriction status.
   */
  const getEffectiveRestrictionStatus = (
    params: MaybeRefOrGetter<Params>,
  ): ComputedRef<EffectiveRestrictionStatus> =>
    computed(() => {
      const { locationId, institutionId, programId } = toValue(params);
      const effectiveRestrictions = institutionRestrictionMap.value
        .get(institutionId)
        ?.filter(
          (institutionRestriction) =>
            institutionRestriction.locationId === locationId &&
            institutionRestriction.programId === programId,
        );
      return {
        hasEffectiveRestriction: !!effectiveRestrictions?.length,
        canCreateOffering: !effectiveRestrictions?.some(
          (effectiveRestriction) =>
            effectiveRestriction.restrictionActions.includes(
              RestrictionActionType.StopOfferingCreate,
            ),
        ),
      };
    });

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionStatus,
  };
}
