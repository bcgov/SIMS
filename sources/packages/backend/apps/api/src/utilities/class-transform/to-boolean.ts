import { Transform } from "class-transformer";

/**
 * Converts a plain property to boolean.
 * @returns function that will return the converted boolean value.
 */
export const ToBoolean = (): ((target: unknown, key: string) => void) => {
  return (target: unknown, key: string) => {
    return Transform(
      ({ obj }) => {
        return valueToBoolean(obj[key]);
      },
      {
        toClassOnly: true,
      },
    )(target, key);
  };
};

/**
 * Converts an object to boolean value, if not a boolean already.
 * @param value expected value to be converted, if needed.
 * @returns boolean value if object is defined.
 */
const valueToBoolean = (value: unknown): boolean | undefined => {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "boolean") {
    return value;
  }
  switch ((value as string).toLowerCase()) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return undefined;
  }
};
