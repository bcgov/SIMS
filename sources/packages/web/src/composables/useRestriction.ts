import { RestrictionStatus, StatusChipTypes } from "@/types";

export interface RestrictionStatusInfo {
  isActive: boolean;
  deletedAt?: Date;
}

export interface RestrictionStatusInfoResult {
  chipStatus: StatusChipTypes;
  restrictionStatus: RestrictionStatus;
}

export function useRestriction() {
  const mapRestrictionChipStatus = (
    restriction: RestrictionStatusInfo,
  ): RestrictionStatusInfoResult => {
    if (restriction.deletedAt) {
      return {
        chipStatus: StatusChipTypes.Default,
        restrictionStatus: RestrictionStatus.Deleted,
      };
    }
    return restriction.isActive
      ? {
          chipStatus: StatusChipTypes.Warning,
          restrictionStatus: RestrictionStatus.Active,
        }
      : {
          chipStatus: StatusChipTypes.Success,
          restrictionStatus: RestrictionStatus.Resolved,
        };
  };
  return { mapRestrictionChipStatus };
}
