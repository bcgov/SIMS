import { BypassStatusChipLabelTypes, StatusChipTypes } from "@/types";

export function useRestrictionBypass() {
  const mapBypassStatus = (isRestrictionActive: boolean): StatusChipTypes => {
    return isRestrictionActive
      ? StatusChipTypes.Warning
      : StatusChipTypes.Success;
  };

  const mapBypassLabel = (
    isRestrictionActive: boolean,
  ): BypassStatusChipLabelTypes => {
    return isRestrictionActive
      ? BypassStatusChipLabelTypes.Active
      : BypassStatusChipLabelTypes.Removed;
  };
  return { mapBypassStatus, mapBypassLabel };
}
