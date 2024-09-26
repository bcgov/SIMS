import { BypassStatusChipLabelTypes, StatusChipTypes } from "@/types";

export function useRestrictionBypassStatus() {
  const mapBypassStatus = (isRestrictionActive: boolean): StatusChipTypes => {
    return isRestrictionActive
      ? StatusChipTypes.Warning
      : StatusChipTypes.Success;
  };

  return { mapBypassStatus };
}

export function useRestrictionBypassLabel() {
  const mapBypassLabel = (
    isRestrictionActive: boolean,
  ): BypassStatusChipLabelTypes => {
    return isRestrictionActive
      ? BypassStatusChipLabelTypes.Active
      : BypassStatusChipLabelTypes.Removed;
  };
  return { mapBypassLabel };
}
