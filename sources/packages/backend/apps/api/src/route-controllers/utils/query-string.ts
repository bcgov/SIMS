import { TransformFnParams } from "class-transformer";

/**
 * While reading boolean values from the query string an additional
 * transformation is needed to parse the values like 'true' and 'false'
 * to a proper boolean.
 * @param params transformer params provided by class-transformer.
 * @returns true if the value is the equivalent to the 'true'
 * string, otherwise, false.
 */
export function ToBoolean(params: TransformFnParams): boolean {
  return params.obj[params.key] === "true";
}
