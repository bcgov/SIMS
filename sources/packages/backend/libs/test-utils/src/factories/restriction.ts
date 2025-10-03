import {
  Restriction,
  RestrictionActionType,
  RestrictionNotificationType,
  RestrictionType,
} from "@sims/sims-db";
import { faker } from "@faker-js/faker";

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
    faker.string.alpha({ length: 10, casing: "upper" });
  restriction.description =
    options?.initialValues.description ?? faker.lorem.words(2);
  restriction.actionType = options?.initialValues.actionType ?? [
    RestrictionActionType.NoEffect,
  ];
  restriction.notificationType =
    options?.initialValues.notificationType ??
    RestrictionNotificationType.NoEffect;
  restriction.isLegacy = options?.initialValues.isLegacy ?? false;
  return restriction;
}
