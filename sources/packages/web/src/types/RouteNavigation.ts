import { RouteLocationRaw } from "vue-router";

export interface BackTarget {
  name?: string;
  to: RouteLocationRaw;
}
