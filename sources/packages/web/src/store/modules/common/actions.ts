import { ActionTree } from "vuex";
import { LoggedInUserClientTypeState, RootState, ClientIdType } from "@/types";

export const actions: ActionTree<LoggedInUserClientTypeState, RootState> = {
  async initialize(context, clientType: ClientIdType): Promise<boolean> {
    context.commit("setClientTypeState", clientType);
    return true;
  },
};
