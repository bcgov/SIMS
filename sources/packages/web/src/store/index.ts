import { createStore, StoreOptions } from "vuex";
import { student } from "@/store/modules/student/student";
import { institution } from "@/store/modules/institution/institution";

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
