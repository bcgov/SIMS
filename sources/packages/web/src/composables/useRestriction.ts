import {
  RestrictionBadgeLabel,
  RestrictionStatus,
  StatusChipTypes,
} from "@/types";

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
  const mapRestrictionBadgeDetails = (
    isActive: boolean,
  ): { label: RestrictionBadgeLabel; status: StatusChipTypes } => {
    return isActive
      ? {
          label: RestrictionBadgeLabel.Restriction,
          status: StatusChipTypes.Warning,
        }
      : {
          label: RestrictionBadgeLabel.NoRestriction,
          status: StatusChipTypes.Success,
        };
  };
  return {
    mapRestrictionChipStatus,
    mapRestrictionBadgeDetails,
  };
}
