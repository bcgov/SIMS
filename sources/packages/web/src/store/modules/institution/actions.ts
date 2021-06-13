import { ActionTree } from "vuex";
import { InstitutionService } from "@/services/InstitutionService";
import {
  InstitutionLocationState,
  RootState,
  InstitutionUserAndAuthDetails,
  InstitutionLocationsDetails
} from "@/types";

export const actions: ActionTree<InstitutionLocationState, RootState> = {
  initialize(): boolean {
    console.log("Initializing the institution store...");
    return true;
  },
  getUserInstitutionDetails(context): Promise<InstitutionUserAndAuthDetails> {
    return new Promise((resolve, reject) => {
      InstitutionService.shared
        .getMyInstitutionDetails()
        .then(resultComment => {
          context.commit("setmyInstitutionAndUserDetailsState", resultComment);
          resolve(resultComment);
        })
        .catch(error => {
          reject(error);
        });
    });
  },

  getUserInstitutionLocationDetails(context): Promise<InstitutionLocationsDetails> {
    return new Promise((resolve, reject) => {
      InstitutionService.shared
        .getMyInstitutionLocationsDetails()
        .then(resultComment => {
          context.commit("setmyInstitutionLocationsDetailsState", resultComment);
          resolve(resultComment);
        })
        .catch(error => {
          reject(error);
        });
    });
  },
};
