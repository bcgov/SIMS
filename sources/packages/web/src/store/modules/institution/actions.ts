import { ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionLocationState,
  InstitutionStateForStore,
  RootState,
} from "@/types";
import { InstitutionUserService } from "@/services/InstitutionUserService";

export const actions: ActionTree<InstitutionLocationState, RootState> = {
  async initialize(context): Promise<boolean> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    await Promise.all([
      context.dispatch("getInstitutionDetails"),
      context.dispatch("getUserInstitutionDetails"),
      context.dispatch("getUserInstitutionLocationDetails"),
    ]);
    return true;
  },

  async getInstitutionDetails(context): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const response = await InstitutionService.shared.getDetail();
    context.commit("setInstitutionDetails", {
      legalOperatingName: response.legalOperatingName,
      operatingName: response.operatingName,
      institutionType: response.institutionTypeName,
      isBCPrivate: response.isBCPrivate,
      hasBusinessGuid: response.hasBusinessGuid,
    } as InstitutionStateForStore);
  },

  async getUserInstitutionDetails(context): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const resultComment =
      await InstitutionUserService.shared.getMyInstitutionDetails();
    context.commit("setMyDetailsState", resultComment?.user);
    context.commit("setMyAuthorizationState", resultComment?.authorizations);
  },

  async getUserInstitutionLocationDetails(context): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const resultComment =
      await InstitutionService.shared.getMyInstitutionLocationsDetails();
    context.commit("setMyInstitutionLocationsDetailsState", resultComment);
  },
};
