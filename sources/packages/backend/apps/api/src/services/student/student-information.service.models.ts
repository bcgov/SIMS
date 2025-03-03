import { Application, PrimaryContact, SFASApplication } from "@sims/sims-db";

export type ApplicationDetail = Application & {
  dependants?: unknown[];
};

export type LegacyApplicationDetail = SFASApplication & {
  estimatedTotalAward: number;
  locationId: number;
  locationName: string;
  locationPrimaryContact: PrimaryContact;
};
