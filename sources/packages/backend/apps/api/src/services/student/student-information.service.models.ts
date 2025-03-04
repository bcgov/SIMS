import { Application } from "@sims/sims-db";

export type ApplicationDetail = Application & {
  dependants?: unknown[];
};
