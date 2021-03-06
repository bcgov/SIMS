import { RouteRecordRaw } from "vue-router";
import PageNotFound from "../views/PageNotFound.vue";

export const sharedRoutes: Array<RouteRecordRaw> = [
  {
    path: "/:pathMatch(.*)*",
    component: PageNotFound,
  },
];
