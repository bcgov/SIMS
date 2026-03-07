import { RestrictedParty } from "@sims/services";
import { RestrictionBypassBehaviors } from "@sims/sims-db";

export interface BypassRestrictionData {
  applicationId: number;
  restrictionId: number;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}

export class AvailableRestrictionData {
  restrictionId: number;
  restrictionType: RestrictedParty.Student | RestrictedParty.Institution;
  restrictionCode: string;
  restrictionCreatedAt: Date;
}
