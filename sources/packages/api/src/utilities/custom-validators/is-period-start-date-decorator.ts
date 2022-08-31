import "reflect-metadata";

const IS_PERIOD_START_DATE_METADATA = "IS_PERIOD_START_DATE";

const IS_PERIOD_START_DATE_METADATA_KEY = Symbol("IsPeriodStartDate");
export function IsPeriodStartDate() {
  return Reflect.metadata(
    IS_PERIOD_START_DATE_METADATA_KEY,
    IS_PERIOD_START_DATE_METADATA,
  );
}

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

function isPeriodStartDate(target: any, propertyKey: string): boolean {
  return (
    Reflect.getMetadata(
      IS_PERIOD_START_DATE_METADATA_KEY,
      target,
      propertyKey,
    ) === IS_PERIOD_START_DATE_METADATA
  );
}
