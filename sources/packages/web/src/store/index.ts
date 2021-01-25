import { createStore, StoreOptions } from "vuex";
import { RootState } from "./states";
import { auth } from "./modules/auth/auth";
import {student} from "./modules/student/student";

const storeOptions: StoreOptions<RootState> = {
  state: {
      version: "1.0.0",
  },
  modules: {
      auth,student
  },
};

export default createStore(storeOptions);