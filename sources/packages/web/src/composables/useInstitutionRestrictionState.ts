import { RestrictionService } from "@/services/RestrictionService";
import {
  InstitutionRestrictionDisplayScope,
  RestrictionActionType,
  RestrictionNotificationType,
} from "@/types";
import { computed, ComputedRef, MaybeRefOrGetter, ref, toValue } from "vue";

/**
 * Subset of notification types that will be considered for institutions.
 */
export type InstitutionRestrictionNotificationType =
  | RestrictionNotificationType.Warning
  | RestrictionNotificationType.Error;

export interface InstitutionRestriction {
  programId?: number;
  locationId?: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
  restrictionNotificationType: InstitutionRestrictionNotificationType;
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
  /**
   * Determine if a scoped identifier matches a restriction identifier.
   * Restrictions without a specific scope (undefined/null) apply to all scopes.
   * @param selectedScopeId the identifier of the selected scope (location or program).
   * @param restrictionScopeId the identifier of the restriction's scope (location or program).
   * @returns true if the selected scope matches the restriction's scope, or if either is undefined/null.
   */
  const matchesRestrictionScope = (
    selectedScopeId: number | undefined,
    restrictionScopeId: number | null | undefined,
  ): boolean =>
    restrictionScopeId == null ||
    selectedScopeId == null ||
    selectedScopeId === restrictionScopeId;

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
   * @returns effective restriction status.
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
            matchesRestrictionScope(
              locationId,
              institutionRestriction.locationId,
            ) ||
            matchesRestrictionScope(
              programId,
              institutionRestriction.programId,
            ),
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
      };
    });

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionState,
  };
}
