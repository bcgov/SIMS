import { SupportingUserType } from "@sims/sims-db";

export interface IdentifiableSupportingUser {
  applicationId: number;
  supportingUserType: SupportingUserType;
  fullName: string;
  isAbleToReport: boolean;
}
