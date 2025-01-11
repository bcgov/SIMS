import {
  ApplicationDataChange,
  ChangeTypes,
} from "./application-data-comparison.models";

/**
 * Compares two sets of student application data and returns an array of changes.
 * Identifies differences between the current and previous
 * data, such as changes in values, additions, or deletions, and represents
 * them as an array of {@link ApplicationDataChange} objects.
 * @param currentData current state of the application data.
 * @param previousData previous state of the application data.
 * @returns array of {@link ApplicationDataChange} objects representing the detected changes.
 */
export function compareApplicationData(
  currentData: unknown,
  previousData: unknown,
): ApplicationDataChange[] {
  // Initial object to allow the recursive function to add changes.
  const initialChanges = new ApplicationDataChange();
  compareApplicationDataRecursive(currentData, previousData, initialChanges);
  const [root] = initialChanges.changes;
  return root?.changes ?? [];
}

/**
 * Recursively compares two sets of student application data and detect the differences.
 * @param currentData current state of the student application data.
 * @param previousData previous state of the student application data.
 * @param parentChange parent change to add the new changes detected.
 * @param options options to support the new change creation.
 * - `propertyKey`: key of the property that changed.
 * - `index`: index of the array item that changed.
 */
function compareApplicationDataRecursive(
  currentData: unknown,
  previousData: unknown,
  parentChange: ApplicationDataChange,
  options?: { propertyKey?: string; index?: number },
): void {
  // Same data, no need to compare.
  if (isEqual(currentData, previousData)) {
    return;
  }
  // Property has a null or undefined value but had a value before or vice versa.
  if (
    (currentData === null && previousData !== null) ||
    (currentData !== null && previousData === null) ||
    (currentData === undefined && previousData !== undefined) ||
    (currentData !== undefined && previousData === undefined)
  ) {
    const newValueChange = new ApplicationDataChange({
      key: options?.propertyKey,
      newValue: currentData,
      oldValue: previousData,
      index: options?.index,
    });
    parentChange.changes.push(newValueChange);
    return;
  }
  // Check array items.
  // previousData is checked also to enforce the type as an array. In case
  // it is null or undefined it will be handled at the previous scenario.
  if (Array.isArray(currentData) && Array.isArray(previousData)) {
    checkArrayChanges(currentData, previousData, parentChange, options);
    return;
  }
  // Check object properties.
  if (typeof currentData === "object") {
    checkObjectChanges(currentData, previousData, parentChange, options);
    return;
  }
  // Property was changed and it is a leaf property.
  const newChange = new ApplicationDataChange({
    key: options?.propertyKey,
    newValue: currentData,
    oldValue: previousData,
    index: options?.index,
  });
  parentChange.changes.push(newChange);
}

/**
 * Checks if an array has changes comparing the currentData and previousData arrays.
 * @param currentData current data array.
 * @param previousData previous data array.
 * @param parentChange parent change that will have the new {@link ApplicationDataChange} added.
 * @param options options to support the new change creation.
 * - `propertyKey`: key of the property that changed.
 * - `index`: index of the array item that changed.
 */
function checkArrayChanges(
  currentData: unknown[],
  previousData: unknown[],
  parentChange: ApplicationDataChange,
  options?: { propertyKey?: string; index?: number },
): void {
  let arrayItemChange: ApplicationDataChange;
  if (!isEqual(currentData, previousData)) {
    arrayItemChange = new ApplicationDataChange({ key: options?.propertyKey });
    parentChange.changes.push(arrayItemChange);
    if (currentData.length < previousData.length) {
      arrayItemChange.changeType = ChangeTypes.ItemsRemoved;
    } else if (currentData.length > previousData.length) {
      arrayItemChange.changeType = ChangeTypes.ItemsAppended;
    }
  }
  // Property is an array that should have its items checked.
  for (let index = 0; index < currentData.length; index++) {
    const currentDataArrayItem = currentData[index];
    const previousDataArrayItem = previousData[index];
    if (!isEqual(currentDataArrayItem, previousDataArrayItem)) {
      compareApplicationDataRecursive(
        currentDataArrayItem,
        previousDataArrayItem,
        arrayItemChange,
        { index },
      );
    }
  }
}

/**
 * Checks if an object has changes comparing the currentData and previousData objects.
 * @param currentData current data object.
 * @param previousData previous data object.
 * @param parentChange parent change that will have the new {@link ApplicationDataChange} added.
 * @param options options to support the new change creation.
 * - `propertyKey`: key of the property that changed.
 * - `index`: index of the array item that changed.
 */
function checkObjectChanges(
  currentData: unknown,
  previousData: unknown,
  parentChange: ApplicationDataChange,
  options?: { propertyKey?: string; index?: number },
): void {
  // Property is an object that should have its properties checked.
  if (!isEqual(currentData, previousData)) {
    const objectPropertyChange = new ApplicationDataChange({
      key: options?.propertyKey,
      index: options?.index,
    });
    if (Object.keys(currentData).length < Object.keys(previousData).length) {
      objectPropertyChange.changeType = ChangeTypes.PropertiesRemoved;
    }
    parentChange.changes.push(objectPropertyChange);
    for (const propertyKey of Object.keys(currentData)) {
      compareApplicationDataRecursive(
        currentData[propertyKey],
        previousData[propertyKey],
        objectPropertyChange,
        { propertyKey },
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
