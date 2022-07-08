import { ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionLocationState,
  InstitutionStateForStore,
  RootState,
} from "@/types";

export const actions: ActionTree<InstitutionLocationState, RootState> = {
  async initialize(context, authHeader?: any): Promise<boolean> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    await Promise.all([
      context.dispatch("getInstitutionDetails", authHeader),
      context.dispatch("getUserInstitutionDetails", authHeader),
      context.dispatch("getUserInstitutionLocationDetails", authHeader),
    ]);
    return true;
  },

  async getInstitutionDetails(context, authHeader?: any): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const response = await InstitutionService.shared.getDetail(
      undefined,
      authHeader,
    );
    context.commit("setInstitutionDetails", {
      legalOperatingName: response.legalOperatingName,
      operatingName: response.operatingName,
      institutionType: response.institutionTypeName,
      isBCPrivate: response.isBCPrivate,
      hasBusinessGuid: response.hasBusinessGuid,
    } as InstitutionStateForStore);
  },

  async getUserInstitutionDetails(context, authHeader?: any): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const resultComment =
      await InstitutionService.shared.getMyInstitutionDetails(authHeader);
    context.commit("setMyDetailsState", resultComment?.user);
    context.commit("setMyAuthorizationState", resultComment?.authorizations);
  },

  async getUserInstitutionLocationDetails(
    context,
    authHeader?: any,
  ): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const resultComment =
      await InstitutionService.shared.getMyInstitutionLocationsDetails(
        authHeader,
      );
    context.commit("setMyInstitutionLocationsDetailsState", resultComment);
  },
};
