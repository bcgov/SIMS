import { RestrictionNotificationType, RestrictionType } from "@sims/sims-db";

export interface FakeRestriction {
  restrictionType: RestrictionType;
  isLegacy: boolean;
  restrictionCode: string;
  notificationType: RestrictionNotificationType;
  description: string;
}

/**
 * Additional data for restrictions created besides the ones
 * already created by the regular DB migrations.
 */
export const RESTRICTIONS_ADDITIONAL_DATA: FakeRestriction[] = [
  {
    restrictionType: RestrictionType.Provincial,
    isLegacy: true,
    restrictionCode: "LGCY_AAAA",
    notificationType: RestrictionNotificationType.NoEffect,
    description: "Description for LGCY_AAAA",
  },
  {
    restrictionType: RestrictionType.Provincial,
    isLegacy: true,
    restrictionCode: "LGCY_BBBB",
    notificationType: RestrictionNotificationType.Warning,
    description: "Description for LGCY_BBBB",
  },
  {
    restrictionType: RestrictionType.Provincial,
    isLegacy: true,
    restrictionCode: "LGCY_CCCC",
    notificationType: RestrictionNotificationType.Error,
    description: "Description for LGCY_CCCC",
  },
];
