import {
  ICustomHeaders,
  IOutputVariables,
} from "@camunda8/sdk/dist/zeebe/types";
import * as JSONPath from "jsonpath";

/**
 * A jsonpath node with an indexer that represents an
 * item that belongs to an array will looks like below.
 * The one to last position will be the index (0 in this case)
 * and the last position will be the property name.
 * @example { value: 'John Doe', path: [ '$', 'dependants', 0, 'fullName' ] }
 */
const INDEXED_PATH_MIN_LENGTH = 2;

/**
 * Object returned by the method jsonpath.nodes.
 * @example
 * { value: 'Not Requested', path: [ '$', 'pdStatus' ] }
 * { value: 'John Doe', path: [ '$', 'dependants', 0, 'fullName' ] }
 */
interface JSONPathNode {
  value: unknown;
  path: JSONPath.PathComponent[];
}

/**
 * Check if the jsonpath node has an indexer inspecting the
 * content of the one to last item in the path.
 * @example
 * Not indexed
 * { value: 'Not Requested', path: [ '$', 'pdStatus' ] }
 * Indexed because has an indexer in one to last position.
 * { value: 'John Doe', path: [ '$', 'dependants', 0, 'fullName' ] }
 * @param node jsonpath node to be inspected.
 * @returns true if it is has an index, otherwise, false.
 */
function hasIndexer(node: JSONPathNode) {
  return (
    node.path.length >= INDEXED_PATH_MIN_LENGTH &&
    typeof node.path[node.path.length - INDEXED_PATH_MIN_LENGTH] === "number"
  );
}

/**
 * Get the value or array of values represented by the jsonpath nodes.
 * @param nodes nodes to have the values converted.
 * @returns value or array of values represented by the jsonpath nodes.
 */
function getValueFromJSONPathNode(nodes: JSONPathNode[]): unknown | unknown[] {
  const [firstNode] = nodes;
  // Checks if an indexer is present which indicates that the node represents an array.
  if (!hasIndexer(firstNode)) {
    return firstNode.value;
  }
  // Process an node that represents an array result.
  const resultObject = new Array<unknown>();
  for (const node of nodes) {
    const propertyName = node.path[node.path.length - 1] as string;
    const index = +node.path[node.path.length - INDEXED_PATH_MIN_LENGTH];
    if (!resultObject[index]) {
      resultObject[index] = {};
    }
    resultObject[index][propertyName] = node.value;
  }
  return resultObject;
}

/**
 * Execute the jsonpath filter in the provided object.
 * @param object object to be filtered by the jsonpath expression.
 * @param jsonPathExpression jsonpath expression.
 * @see https://goessner.net/articles/JsonPath.
 * @returns the object or array of objects resulted from the
 * jsonpath expression execution.
 */
function getJsonPathNodeValue(
  object: unknown,
  jsonPathExpression: string,
): unknown | unknown[] {
  const jsonPathNode = JSONPath.nodes(object, jsonPathExpression);
  if (!jsonPathNode.length) {
    return null;
  }
  return getValueFromJSONPathNode(jsonPathNode);
}

/**
 * Creates a new object based in the filter object provided.
 * @param object object to have the jsonpath expressions executed.
 * @param filter key/value object where the keys will be used
 * to generate the properties that will then contain the values
 * resulting from the jsonpath expressions execution.
 * @returns new object with one property for each filter key provided
 * where the values for each property are the values
 * resulting from the jsonpath expressions execution.
 * @example
 * // Assuming the below object.
 * {
 *   identity: {
 *     firstName: "John",
 *     lastName: "Doe"
 *   }
 *   age: 13,
 *   address: {
 *     street: "Some street",
 *     number: 123
 *   }
 * }
 * // Assuming the below filter object:
 * {
 *   familyName: "$.identity.lastName",
 *   streetNumber: "$.address.number"
 * }
 * // The result object will be:
 * {
 *    familyName: "John Doe",
 *    streetNumber: "123"
 * }
 */
export function filterObjectProperties(
  object: unknown,
  filter: ICustomHeaders,
): IOutputVariables {
  const resultObject = {} as Record<string, unknown>;
  Object.keys(filter).forEach((filterKey: string) => {
    if (object) {
      // If the value returned by getJsonPathNodeValue is undefined null will be used as fallback.
      // This method is mostly used to return values to the Workflow and if the property
      // is set as undefined it will prevent the variable from being created on Camunda.
      resultObject[filterKey] =
        getJsonPathNodeValue(object, filter[filterKey].toString()) ?? null;
    } else {
      resultObject[filterKey] = null;
    }
  });
  return resultObject as IOutputVariables;
}
