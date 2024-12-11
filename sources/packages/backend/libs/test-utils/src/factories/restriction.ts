import {
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";
import * as faker from "faker";

/**
 * Creates a fake restriction to be persisted.
 * @param options - options for creating the fake restriction.
 * - `initialValues`: initial values to override the default ones for the restriction fields.
 * @returns fake restriction to be persisted.
 */
export function createFakeRestriction(options?: {
  initialValues: Partial<Restriction>;
}): Restriction {
  const restriction = new Restriction();
  restriction.restrictionType =
    options?.initialValues.restrictionType ?? RestrictionType.Provincial;
  restriction.restrictionCategory =
    options?.initialValues.restrictionCategory ?? "Other";
  restriction.restrictionCode =
    options?.initialValues.restrictionCode ??
    faker.random.alpha({ count: 10, upcase: true });
  restriction.description =
    options?.initialValues.description ?? faker.random.words(2);
  restriction.actionType = options?.initialValues.actionType ?? [
    RestrictionActionType.NoEffect,
  ];
  restriction.notificationType =
    options?.initialValues.notificationType ??
    RestrictionNotificationType.NoEffect;
  restriction.isLegacy = options?.initialValues.isLegacy ?? false;
  return restriction;
}
