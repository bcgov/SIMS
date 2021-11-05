import { getDateOnlyFromFormat } from "../../utilities";

const DATE_FORMAT = "YYYYMMDD";

export function parseDate(stringDate?: string): Date | undefined {
  if (stringDate?.trim().length === DATE_FORMAT.length) {
    return getDateOnlyFromFormat(stringDate, DATE_FORMAT);
  }
  return undefined;
}

export function parseDecimal(decimalString: string): number | undefined {
  // Divide by 100 to convert to 2 decimal places.
  return +decimalString / 100;
}
