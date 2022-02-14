import { createStore, StoreOptions } from "vuex";
import { student } from "./modules/student/student";
import { institution } from "./modules/institution/institution";

export interface RootState {
  version: string;
}

const storeOptions: StoreOptions<RootState> = {
  state: {
    version: "1.0.0",
  },
  modules: {
    student,
    institution,
  },
};

export default createStore(storeOptions);
