import * as jsonpath from "jsonpath";

const INDEXED_PATH_MIN_LENGTH = 2;

interface JSONPathNode {
  value: unknown;
  path: unknown[];
}

interface IndexedJSONPathNode {
  value: unknown;
  propertyName: string;
  index: number;
}

function hasIndexer(node: JSONPathNode) {
  return (
    node.path.length >= INDEXED_PATH_MIN_LENGTH &&
    typeof node.path[node.path.length - INDEXED_PATH_MIN_LENGTH] === "number"
  );
}

function getIndexedJSONPathNode(node: JSONPathNode): IndexedJSONPathNode {
  return {
    value: node.value,
    propertyName: node.path[node.path.length - 1] as string,
    index: +node.path[node.path.length - INDEXED_PATH_MIN_LENGTH],
  };
}

function getValueFromJSONPathNode(nodes: JSONPathNode[]): unknown | unknown[] {
  const [firstNode] = nodes;
  // Checks if an indexer is present which indicates that the node represents an array.
  if (!hasIndexer(firstNode)) {
    return firstNode.value;
  }
  // Process an node that represents an array result.
  const resultObject = new Array<unknown>();
  for (const node of nodes) {
    const indexedItem = getIndexedJSONPathNode(node);
    if (!resultObject[indexedItem.index]) {
      resultObject[indexedItem.index] = {};
    }
    resultObject[indexedItem.index][indexedItem.propertyName] =
      indexedItem.value;
  }
  return resultObject;
}

function getJsonPathNodeValue(
  value: unknown,
  jsonPathExpression: string,
): unknown {
  const jsonPathNode = jsonpath.nodes(value, jsonPathExpression);
  if (!jsonPathNode.length) {
    return null;
  }
  return getValueFromJSONPathNode(jsonPathNode);
}

export function filterObjectProperties(
  object: unknown,
  filter: Record<string, string>,
): unknown {
  const resultObject = {} as Record<string, unknown>;
  Object.keys(filter).forEach((filterKey: string) => {
    resultObject[filterKey] = getJsonPathNodeValue(object, filter[filterKey]);
  });
  return resultObject;
}
