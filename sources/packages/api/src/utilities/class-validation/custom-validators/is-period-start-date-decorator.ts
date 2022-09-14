import "reflect-metadata";

/**
 * Metadata associated with a property that is decorated with this decorator.
 */
const IS_PERIOD_START_DATE_METADATA = "IS_PERIOD_START_DATE";

/**
 * Uniquely identifies the metadata for the decorator.
 */
const IS_PERIOD_START_DATE_METADATA_KEY = Symbol("IsPeriodStartDate");

/**
 * Decorator that identifies if a property should be considered
 * the start date of an period.
 * @returns decorator metadata.
 */
export function IsPeriodStartDate() {
  return Reflect.metadata(
    IS_PERIOD_START_DATE_METADATA_KEY,
    IS_PERIOD_START_DATE_METADATA,
  );
}

/**
 * Checks if the target object has some property decorated with
 * the period start date decorator.
 * @param target object to have the properties verified.
 * @returns first property found with the decorator or undefined.
 */
export function getPeriodStartDateProperty(
  target: unknown,
): string | undefined {
  for (const property of Object.keys(target)) {
    const isStartDate = isPeriodStartDate(target, property);
    if (isStartDate) {
      return property;
    }
  }
  return undefined;
}

/**
 * Checks if a object property is decorated with the
 * the period start date decorator.
 * @param target object being inspected.
 * @param propertyKey property being inspected.
 * @returns true if the property is decorated with the
 * the period start date decorator.
 */
function isPeriodStartDate(target: any, propertyKey: string): boolean {
  return (
    Reflect.getMetadata(
      IS_PERIOD_START_DATE_METADATA_KEY,
      target,
      propertyKey,
    ) === IS_PERIOD_START_DATE_METADATA
  );
}
