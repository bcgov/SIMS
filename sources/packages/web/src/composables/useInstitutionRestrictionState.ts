import { RestrictionService } from "@/services/RestrictionService";
import { RestrictionActionType, RestrictionNotificationType } from "@/types";
import { computed, ComputedRef, MaybeRefOrGetter, ref, toValue } from "vue";

/**
 * Subset of notification types that will be considered for institutions.
 */
export type InstitutionRestrictionNotificationType =
  | RestrictionNotificationType.Warning
  | RestrictionNotificationType.Error;

interface InstitutionRestriction {
  programId?: number;
  locationId?: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
  restrictionNotificationType: InstitutionRestrictionNotificationType;
}

export interface EffectiveRestrictionState {
  hasEffectiveRestriction: boolean;
  errorRestrictions: InstitutionRestriction[];
  warningRestrictions: InstitutionRestriction[];
  canCreateOffering: boolean;
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
        restrictionNotificationType:
          item.restrictionNotificationType as InstitutionRestrictionNotificationType,
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
  const getEffectiveRestrictionState = (
    params: MaybeRefOrGetter<Params>,
  ): ComputedRef<EffectiveRestrictionState> =>
    computed(() => {
      const { locationId, institutionId, programId } = toValue(params);
      const effectiveRestrictions = institutionRestrictionMap.value
        .get(institutionId)
        ?.filter(
          (institutionRestriction) =>
            (!locationId || institutionRestriction.locationId === locationId) &&
            (!programId || institutionRestriction.programId === programId),
        );
      return {
        hasEffectiveRestriction: !!effectiveRestrictions?.length,
        canCreateOffering: !effectiveRestrictions?.some(
          (effectiveRestriction) =>
            effectiveRestriction.restrictionActions.includes(
              RestrictionActionType.StopOfferingCreate,
            ),
        ),
        errorRestrictions:
          effectiveRestrictions?.filter(
            (effectiveRestriction) =>
              effectiveRestriction.restrictionNotificationType ===
              RestrictionNotificationType.Error,
          ) ?? [],
        warningRestrictions:
          effectiveRestrictions?.filter(
            (effectiveRestriction) =>
              effectiveRestriction.restrictionNotificationType ===
              RestrictionNotificationType.Warning,
          ) ?? [],
      };
    });

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionState,
  };
}
