import { RestrictionService } from "@/services/RestrictionService";
import { EffectiveRestrictionStatus, RestrictionActionType } from "@/types";
import { computed, ComputedRef, ref } from "vue";

interface InstitutionRestriction {
  programId: number;
  locationId: number;
  restrictionCode: string;
  restrictionActions: RestrictionActionType[];
}

interface InstitutionRestrictionState {
  data: Map<number, InstitutionRestriction[]>;
  institutionId?: number;
}
const state = ref({
  data: new Map<number, InstitutionRestriction[]>(),
} as InstitutionRestrictionState);
export function useInstitutionRestrictionState(institutionId?: number) {
  const updateInstitutionRestrictionState = async () => {
    const institutionRestrictions =
      await RestrictionService.shared.getActiveInstitutionRestrictions({
        institutionId,
      });
    state.value.data.set(
      institutionRestrictions.institutionId,
      institutionRestrictions.items.map((item) => ({
        locationId: item.locationId,
        programId: item.programId,
        restrictionCode: item.restrictionCode,
        restrictionActions: item.restrictionActions,
      })),
    );
    // State is accessed in the scope of a specific institution,
    // so set the institution id to the state.
    if (!institutionId) {
      state.value.institutionId = institutionRestrictions.institutionId;
    }
  };
  const getInstitutionRestrictions = () => {
    if (!state.value.data.size) {
      return [];
    }
    const key = institutionId ?? state.value.institutionId;
    if (!key) {
      throw new Error("Institution id is expected and not provided.");
    }
    return state.value.data.get(key) ?? [];
  };

  const hasActiveRestriction = computed(() => {
    const restrictions = getInstitutionRestrictions();
    return !!restrictions.length;
  });

  /**
   * Get the effective institution restriction status for a location and program.
   * @param locationId location id.
   * @param programId program id.
   * @returns effective restriction status.
   */
  const getEffectiveRestrictionStatus = (
    locationId: number,
    programId: number,
  ): ComputedRef<EffectiveRestrictionStatus> => {
    return computed(() => {
      const effectiveRestrictions = getInstitutionRestrictions().filter(
        (institutionRestriction) =>
          institutionRestriction.locationId === locationId &&
          institutionRestriction.programId === programId,
      );
      return {
        hasEffectiveRestriction: !!effectiveRestrictions.length,
        canCreateOffering: !effectiveRestrictions.some((effectiveRestriction) =>
          effectiveRestriction.restrictionActions.includes(
            RestrictionActionType.StopOfferingCreate,
          ),
        ),
      };
    });
  };

  return {
    updateInstitutionRestrictionState,
    hasActiveRestriction,
    getEffectiveRestrictionStatus,
  };
}
