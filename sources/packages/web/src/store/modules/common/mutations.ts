import { MutationTree } from "vuex";
import { LoggedInUserClientTypeState, ClientIdType } from "@/types";

export const mutations: MutationTree<LoggedInUserClientTypeState> = {
  setClientTypeState(
    state: LoggedInUserClientTypeState,
    clientType: ClientIdType,
  ) {
    state.clientType = clientType;
  },
};
