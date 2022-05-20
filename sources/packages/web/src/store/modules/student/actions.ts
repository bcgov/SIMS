import { ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import { RootState } from "@/types";
import { StudentState } from "./student";
import { StudentApi } from "@/services/http/StudentApi";
import { StudentService } from "@/services/StudentService";

export const actions: ActionTree<StudentState, RootState> = {
  async updateProfileData(context, authHeader?: any): Promise<void> {
    /*
    authHeader are only needed for initial stores, 
    since during the first initializing token are not ready yet
    */
    const response = await StudentService.shared.getStudentProfile()
    
    ..sha InstitutionService.shared.getDetail(
      undefined,
      authHeader,
    );
    context.commit("setInstitutionDetails", {
      legalOperatingName: response.legalOperatingName,
      operatingName: response.operatingName,
      institutionType: response.institutionTypeName,
      isBCPrivate: response.isBCPrivate,
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
