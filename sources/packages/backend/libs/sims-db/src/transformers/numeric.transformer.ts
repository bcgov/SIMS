import { ValueTransformer } from "typeorm";

/***
 * Allow a numeric column type on Postgres to be mapped to a javascript
 * number type instead of the out-of-box conversion to a string.
 * This transformer should be used only if the expected number
 * stored on Postgres is not expected to exceed the maximum
 * value supported by the javascript number type.
 */
export const numericTransformer: ValueTransformer = {
  /**
   * Converts the database value, received as string, to a number.
   * @param value values received from database as string.
   * @returns numeric/decimal string converted to a number.
   */
  from: (value: string | null): number | null => {
    if (value !== null) {
      return parseFloat(value);
    }
    return null;
  },

  /**
   * Converts the number to a string as expected by Typeorm.
   * @param value number to be converted to the string.
   * @returns the converted string.
   */
  to: (value?: number): string => {
    return value?.toString();
  },
};
