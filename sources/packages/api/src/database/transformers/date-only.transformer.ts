import * as dayjs from "dayjs";
import { getDateOnly } from "../../utilities";
import { FindOperator, ValueTransformer } from "typeorm";
export const TYPEORM_DATE_ONLY_FORMAT = "YYYY-MM-DD";

/***
 * Format a date in the same expected format that a date only
 * string is received from Typeorm entity when mapping a
 * Date only field on database.
 */
export function formatDateOnly(date?: Date): string | undefined {
  if (date) {
    return dayjs(date).format(TYPEORM_DATE_ONLY_FORMAT);
  }
  return undefined;
}

/***
 * Allow that the a date-only column on Postgres can
 * be mapped to a Date object with local time always
 * defined as zero.
 * When mapping a Date only field from database Typeorm
 * will use a string object. This transformer will allow
 * the conversion to a javascript Date object to avoid the
 * issues while converting a string with no time specified,
 * as the one returned from the database.
 */
export const dateOnlyTransformer: ValueTransformer = {
  from: (dbValue: string | null): Date | null => {
    return getDateOnly(dbValue);
  },

  to: (
    entityValue: Date | FindOperator<any> | null,
  ): string | FindOperator<any> | null => {
    if (entityValue instanceof FindOperator) {
      return entityValue;
    }

    return formatDateOnly(entityValue);
  },
};
