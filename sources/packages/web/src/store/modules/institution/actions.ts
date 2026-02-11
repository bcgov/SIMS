import { ActionContext, ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionLocationState,
  InstitutionStateForStore,
  RootState,
} from "@/types";
import { InstitutionUserService } from "@/services/InstitutionUserService";

export const actions: ActionTree<InstitutionLocationState, RootState> = {
  /**
   * Get all store information needed for the institution store.
   * @param context store context.
   */
  async initialize(context): Promise<void> {
    await Promise.all([
      context.dispatch("getInstitutionDetails"),
      context.dispatch("getUserInstitutionDetails"),
      context.dispatch("getUserInstitutionLocationDetails"),
    ]);
  },

  /**
   * Get institution details needed for the institution store.
   * @param context store context.
   */
  async getInstitutionDetails(context): Promise<void> {
    const response = await InstitutionService.shared.getDetail();
    context.commit("setInstitutionDetails", {
      legalOperatingName: response.legalOperatingName,
      operatingName: response.operatingName,
      isBCPrivate: response.isBCPrivate,
      isBCPublic: response.isBCPublic,
      hasBusinessGuid: response.hasBusinessGuid,
    } as InstitutionStateForStore);
  },

  /**
   * Get institution user details needed for the institution store.
   * @param context store context.
   */
  async getUserInstitutionDetails(context): Promise<void> {
    const resultComment =
      await InstitutionUserService.shared.getMyInstitutionDetails();
    context.commit("setMyDetailsState", resultComment?.user);
    context.commit("setMyAuthorizationState", resultComment?.authorizations);
  },

  /**
   * Get institution location details needed for the institution store.
   * @param context store context.
   */
  async getUserInstitutionLocationDetails(context): Promise<void> {
    const resultComment =
      await InstitutionService.shared.getMyInstitutionLocationsDetails();
    context.commit("setMyInstitutionLocationsDetailsState", resultComment);
  },

  /**
   * Set the institution setup user property to institution user state.
   * @param context action context.
   */
  setInstitutionSetupUser(
    context: ActionContext<InstitutionLocationState, RootState>,
  ): void {
    context.commit("setInstitutionSetupUser", true);
  },
};
