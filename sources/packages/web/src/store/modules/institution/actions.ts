import { ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import { InstitutionLocationState, RootState } from "@/types";

export const actions: ActionTree<InstitutionLocationState, RootState> = {
  initialize(context): boolean {
    context.dispatch("getUserInstitutionDetails");
    context.dispatch("getUserInstitutionLocationDetails");
    return true;
  },

  async getUserInstitutionDetails(context): Promise<void> {
    const resultComment = await InstitutionService.shared.getMyInstitutionDetails();
    context.commit("setMyDetailsState", resultComment?.user);
    context.commit("setMyAuthorizationState", resultComment?.authorizations);
  },

  async getUserInstitutionLocationDetails(context): Promise<void> {
    const resultComment = await InstitutionService.shared.getMyInstitutionLocationsDetails();
    context.commit("setMyInstitutionLocationsDetailsState", resultComment);
  },
};
