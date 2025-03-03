import { Application, SFASApplication } from "@sims/sims-db";

export type ApplicationDetail = Application & {
  dependants?: unknown[];
};

export type LegacyApplicationDetail = SFASApplication & {
  estimatedTotalAward: number;
};
