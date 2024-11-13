import { RestrictionBypassBehaviors } from "@sims/sims-db";

export interface BypassRestrictionData {
  applicationId: number;
  studentRestrictionId: number;
  bypassBehavior: RestrictionBypassBehaviors;
  note: string;
}

export class AvailableStudentRestrictionData {
  studentRestrictionId: number;
  restrictionCode: string;
  studentRestrictionCreatedAt: Date;
}
