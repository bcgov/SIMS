import { RestrictionService } from "@/services/RestrictionService";
import {
  InstitutionRestrictionDisplayScope,
  RestrictionActionType,
  RestrictionNotificationType,
} from "@/types";
import { computed, ComputedRef, MaybeRefOrGetter, ref, toValue } from "vue";

export interface InstitutionRestriction {
  programId?: number;
  locationId?: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
  restrictionNotificationType: RestrictionNotificationType;
  displayScope?: InstitutionRestrictionDisplayScope;
  bannerMessage?: string;
}

export interface EffectiveRestrictionState {
  /**
   * Indicates whether the institution can create an offering.
   */
  canCreateOffering: boolean;
  /**
   * Error restrictions for a given scope (location, program, or institution).
   */
  errorRestrictions: InstitutionRestriction[];
  /**
   * Warning restrictions for a given scope (location, program, or institution).
   */
  warningRestrictions: InstitutionRestriction[];
  /**
   * No effect restrictions for a given scope (location, program, or institution).
   * Not available for all clients, but can be used to display a banner message for informational purposes.
   */
  noEffectRestrictions: InstitutionRestriction[];
}

interface Params {
  locationId?: number;
  institutionId?: number;
  programId?: number;
  scope?: InstitutionRestrictionDisplayScope;
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
        restrictionNotificationType: item.restrictionNotificationType,
        displayScope: item.displayScope,
        bannerMessage: item.bannerMessage,
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
   * Get the effective institution restriction state for a location and program.
   * @param params getter parameters.
   * @returns effective restriction state.
   */
  const getEffectiveRestrictionState = (
    params: MaybeRefOrGetter<Params>,
  ): ComputedRef<EffectiveRestrictionState> =>
    computed(() => {
      const { locationId, institutionId, programId, scope } = toValue(params);
      const effectiveRestrictions = institutionRestrictionMap.value
        .get(institutionId)
        ?.filter(
          (institutionRestriction) =>
            (institutionRestriction.locationId === locationId ||
              !institutionRestriction.locationId) &&
            (institutionRestriction.programId === programId ||
              !institutionRestriction.programId),
        );
      const scopedRestrictions = effectiveRestrictions?.filter(
        (restriction) => !scope || restriction.displayScope === scope,
      );
      return {
        canCreateOffering: !effectiveRestrictions?.some(
          (effectiveRestriction) =>
            effectiveRestriction.restrictionActions.includes(
              RestrictionActionType.StopOfferingCreate,
            ),
        ),
        errorRestrictions:
          scopedRestrictions?.filter(
            (restriction) =>
              restriction.restrictionNotificationType ===
              RestrictionNotificationType.Error,
          ) ?? [],
        warningRestrictions:
          scopedRestrictions?.filter(
            (restriction) =>
              restriction.restrictionNotificationType ===
              RestrictionNotificationType.Warning,
          ) ?? [],
        noEffectRestrictions:
          scopedRestrictions?.filter(
            (restriction) =>
              restriction.restrictionNotificationType ===
              RestrictionNotificationType.NoEffect,
          ) ?? [],
      };
    });

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionState,
  };
}
