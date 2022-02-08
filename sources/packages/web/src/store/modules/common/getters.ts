import { GetterTree } from "vuex";
import { LoggedInUserClientTypeState, RootState, ClientIdType } from "@/types";

export const getters: GetterTree<LoggedInUserClientTypeState, RootState> = {
  clientType(state: LoggedInUserClientTypeState): ClientIdType {
    const { clientType } = state;
    return clientType;
  },
};
