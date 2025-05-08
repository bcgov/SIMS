import { SFASRestriction } from "@sims/sims-db";
import { getISODateOnlyString } from "@sims/utilities";
import * as faker from "faker";

/**
 * Create and save fake SFAS restriction.
 * @param options SFAS restriction options.
 * - `initialValues`initial values.
 * @returns SFAS restriction to be persisted.
 */
export function createFakeSFASRestriction(options?: {
  initialValues?: Partial<SFASRestriction>;
}): SFASRestriction {
  const now = new Date();
  const restriction = new SFASRestriction();
  restriction.id = options?.initialValues.id;
  restriction.individualId = options?.initialValues.individualId;
  restriction.code =
    options?.initialValues.code ??
    faker.random.alpha({ count: 4, upcase: true });
  restriction.effectiveDate =
    options?.initialValues.effectiveDate ?? getISODateOnlyString(now);
  restriction.removalDate = options?.initialValues.removalDate;
  restriction.extractedAt = options?.initialValues.extractedAt ?? now;
  restriction.processed = options?.initialValues.processed ?? false;
  return restriction;
}
