import { createStore, StoreOptions } from "vuex";
import { student } from "./modules/student/student";

export interface RootState {
  version: string;
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    version: "1.0.0",
  },
  modules: {
    student,
  },
};

export default createStore(storeOptions);
