import "reflect-metadata";

const IS_PERIOD_END_DATE_METADATA = "IS_PERIOD_END_DATE";
const IS_PERIOD_END_DATE_METADATA_KEY = Symbol("IsPeriodEndDate");

export function IsPeriodEndDate() {
  return Reflect.metadata(
    IS_PERIOD_END_DATE_METADATA_KEY,
    IS_PERIOD_END_DATE_METADATA,
  );
}

export function getPeriodEndDateProperty(target: unknown): string | undefined {
  for (const property of Object.keys(target)) {
    const isStartDate = isPeriodEndDate(target, property);
    if (isStartDate) {
      return property;
    }
  }
  return undefined;
}

export function isPeriodEndDate(target: any, propertyKey: string): boolean {
  return (
    Reflect.getMetadata(
      IS_PERIOD_END_DATE_METADATA_KEY,
      target,
      propertyKey,
    ) === IS_PERIOD_END_DATE_METADATA
  );
}
