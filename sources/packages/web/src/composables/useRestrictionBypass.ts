import { StatusChipTypes } from "@/types";

export function useRestrictionBypass() {
  const mapBypassStatus = (isRestrictionActive: boolean): StatusChipTypes => {
    return isRestrictionActive
      ? StatusChipTypes.Warning
      : StatusChipTypes.Success;
  };

  return { mapBypassStatus };
}
