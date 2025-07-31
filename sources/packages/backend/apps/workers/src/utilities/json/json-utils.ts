import {
  ICustomHeaders,
  IOutputVariables,
} from "@camunda8/sdk/dist/zeebe/types";
import * as jsonata from "jsonata";

/**
 * Creates a new object based in the filter object provided.
 * @param object object to have the jsonata expressions executed.
 * @param filter key/value object where the keys will be used
 * to generate the properties that will then contain the values
 * resulting from the jsonata expressions execution.
 * @returns new object with one property for each filter key provided
 * where the values for each property are the values
 * resulting from the jsonata expressions execution.
 */
export async function filterObjectProperties(
  object: unknown,
  filter: ICustomHeaders,
): Promise<IOutputVariables> {
  const resultObject = {} as Record<string, unknown>;
  for (const filterKey of Object.keys(filter)) {
    if (object) {
      try {
        const expression = jsonata(filter[filterKey].toString());
        const result = await expression.evaluate(object);
        // If the value returned by getJsonPathNodeValue is undefined null will be used as fallback.
        // This method is mostly used to return values to the Workflow and if the property
        // is set as undefined it will prevent the variable from being created on Camunda.
        resultObject[filterKey] = result ?? null;
      } catch (error: unknown) {
        throw new Error(
          `There was an error while executing the jsonata expression ${filter[filterKey]}.`,
          { cause: error },
        );
      }
    } else {
      resultObject[filterKey] = null;
    }
  }
  return resultObject as IOutputVariables;
}
