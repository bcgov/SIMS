import { createStore, StoreOptions } from "vuex";
import { RootState } from "./states";
import { auth } from "./modules/auth/auth";

const storeOptions: StoreOptions<RootState> = {
  state: {
    version: "1.0.0"
  },
  modules: {
    auth
  }
};

export default createStore(storeOptions);
