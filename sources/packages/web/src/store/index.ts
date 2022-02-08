import { createStore, StoreOptions } from "vuex";
import { student } from "./modules/student/student";
import { institution } from "./modules/institution/institution";
import { common } from "./modules/common/common";

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
    common,
  },
};

export default createStore(storeOptions);
