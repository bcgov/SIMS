import { StatusChipTypes } from "@/types";

export function useRestrictionBypass() {
  const mapBypassStatus = (isBypassActive: boolean): StatusChipTypes => {
    return isBypassActive ? StatusChipTypes.Warning : StatusChipTypes.Success;
  };

  return { mapBypassStatus };
}
