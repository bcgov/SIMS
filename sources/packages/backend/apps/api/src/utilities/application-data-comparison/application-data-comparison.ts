import { ApplicationChange } from "./application-data-comparison.models";

export function compareApplicationData(
  newData: unknown,
  previousData: unknown,
): ApplicationChange[] {
  const rootChanges = new ApplicationChange();
  compareApplicationDataRecursive(newData, previousData, rootChanges);
  const [root] = rootChanges.changes;
  return root.changes;
}

function compareApplicationDataRecursive(
  newData: unknown,
  previousData: unknown,
  parentChange: ApplicationChange,
  propertyKey?: string,
  index?: number,
) {
  // Same data, no need to compare.
  if (isEqual(newData, previousData)) {
    return;
  }
  // Property has a null or undefined value but had a value before or vice versa.
  if (
    (newData == null && previousData != null) ||
    (newData != null && previousData == null)
  ) {
    const newValueChange = new ApplicationChange(
      propertyKey,
      newData,
      previousData,
      index,
    );
    parentChange.changes.push(newValueChange);
    return;
  }
  // Check array items.
  // previousData is checked also to enforce the type as an array. In case
  // it is null or undefined it will be handled at the previous scenario.
  if (Array.isArray(newData) && Array.isArray(previousData)) {
    checkArrayChanges(newData, previousData, parentChange, propertyKey);
    return;
  }
  // Check object properties.
  if (typeof newData === "object") {
    // Property is a object that should have its properties checked.
    checkObjectChanges(newData, previousData, parentChange, propertyKey, index);
    return;
  }
  // Property is a changed leaf property.
  const newChange = new ApplicationChange(
    propertyKey,
    newData,
    previousData,
    index,
  );
  parentChange.changes.push(newChange);
}

function checkArrayChanges(
  newData: unknown[],
  previousData: unknown[],
  parentChange: ApplicationChange,
  propertyKey?: string,
): void {
  let arrayItemChange: ApplicationChange;
  if (!isEqual(newData, previousData)) {
    arrayItemChange = new ApplicationChange(propertyKey);
    parentChange.changes.push(arrayItemChange);
  }
  // Property is an array that should have its items checked.
  for (let i = 0; i < newData.length; i++) {
    const newDataArrayItem = newData[i];
    const previousDataArrayItem = previousData[i];
    if (!isEqual(newDataArrayItem, previousDataArrayItem)) {
      compareApplicationDataRecursive(
        newDataArrayItem,
        previousDataArrayItem,
        arrayItemChange,
        undefined,
        i,
      );
    }
  }
}

function checkObjectChanges(
  newData: unknown,
  previousData: unknown,
  parentChange: ApplicationChange,
  propertyKey?: string,
  index?: number,
): void {
  if (!isEqual(newData, previousData)) {
    const objectPropertyChange = new ApplicationChange(propertyKey);
    parentChange.changes.push(objectPropertyChange);
    for (const key of Object.keys(newData)) {
      compareApplicationDataRecursive(
        newData[key],
        previousData[key],
        objectPropertyChange,
        key,
        index,
      );
    }
  }
}

/**
 * Define if two objects can be considered the same
 * based on their JSON representation.
 * @param a first object to be compared.
 * @param b second object to be compared.
 * @returns true if objects are considered the same.
 */
function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
