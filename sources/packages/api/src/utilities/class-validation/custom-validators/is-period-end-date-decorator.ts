import "reflect-metadata";

/**
 * Metadata associated with a property that is decorated with this decorator.
 */
const IS_PERIOD_END_DATE_METADATA = "IS_PERIOD_END_DATE";

/**
 * Uniquely identifies the metadata for the decorator.
 */
const IS_PERIOD_END_DATE_METADATA_KEY = Symbol("IsPeriodEndDate");

/**
 * Decorator that identifies if a property should be considered
 * the end date of an period.
 * @returns decorator metadata.
 */
export function IsPeriodEndDate() {
  return Reflect.metadata(
    IS_PERIOD_END_DATE_METADATA_KEY,
    IS_PERIOD_END_DATE_METADATA,
  );
}

/**
 * Checks if the target object has some property decorated with
 * the period end date decorator.
 * @param target object to have the properties verified.
 * @returns first property found with the decorator or undefined.
 */
export function getPeriodEndDateProperty(target: unknown): string | undefined {
  for (const property of Object.keys(target)) {
    const isEndDate = isPeriodEndDate(target, property);
    if (isEndDate) {
      return property;
    }
  }
  return undefined;
}

/**
 * Checks if a object property is decorated with the
 * the period end date decorator.
 * @param target object being inspected.
 * @param propertyKey property being inspected.
 * @returns true if the property is decorated with the
 * the period end date decorator.
 */
export function isPeriodEndDate(target: any, propertyKey: string): boolean {
  return (
    Reflect.getMetadata(
      IS_PERIOD_END_DATE_METADATA_KEY,
      target,
      propertyKey,
    ) === IS_PERIOD_END_DATE_METADATA
  );
}
