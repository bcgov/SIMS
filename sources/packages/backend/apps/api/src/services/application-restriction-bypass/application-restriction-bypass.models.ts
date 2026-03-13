import { RestrictedParty } from "@sims/services";
import { RestrictionBypassBehaviors } from "@sims/sims-db";

export interface BypassRestrictionData {
  applicationId: number;
  restrictionId: number;
  restrictedParty: RestrictedParty;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}

export class AvailableRestrictionData {
  restrictionId: number;
  restrictedParty: RestrictedParty;
  restrictionCode: string;
  restrictionCreatedAt: Date;
}
