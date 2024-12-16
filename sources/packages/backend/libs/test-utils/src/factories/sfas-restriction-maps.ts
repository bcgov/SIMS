import { SFASRestrictionMap } from "@sims/sims-db";

/**
 * Create and save fake SFAS restrictions map .
 * @param options SFAS restrictions maps options.
 * - `initialValues`initial values.
 * @returns SFAS restrictions map to be persisted.
 */
export function createFakeSFASRestrictionMaps(options?: {
  initialValues?: Partial<SFASRestrictionMap>;
}): SFASRestrictionMap {
  const restrictionMap = new SFASRestrictionMap();
  restrictionMap.legacyCode = options?.initialValues.legacyCode ?? "AA";
  restrictionMap.isLegacyOnly = options?.initialValues.isLegacyOnly ?? true;
  restrictionMap.code = options?.initialValues.code ?? "LGCY_AA";
  return restrictionMap;
}
