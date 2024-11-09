import { RestrictionBypassBehaviors } from "@sims/sims-db";

export interface BypassRestrictionData {
  applicationId: number;
  studentRestrictionId: number;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}
