import { ApplicationDataChange } from "./application-data-comparison.models";

export function compareApplicationData(
  currentData: unknown,
  previousData: unknown,
): ApplicationDataChange[] {
  // Initial object to allow the recursive function to add changes.
  const initialChanges = new ApplicationDataChange();
  compareApplicationDataRecursive(currentData, previousData, initialChanges);
  const [root] = initialChanges.changes;
  return root.changes;
}

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
    (currentData == null && previousData != null) ||
    (currentData != null && previousData == null)
  ) {
    const newValueChange = new ApplicationDataChange(
      options?.propertyKey,
      currentData,
      previousData,
      options?.index,
    );
    parentChange.changes.push(newValueChange);
    return;
  }
  // Check array items.
  if (Array.isArray(currentData) && Array.isArray(previousData)) {
    let arrayItemChange: ApplicationDataChange;
    if (!isEqual(currentData, previousData)) {
      arrayItemChange = new ApplicationDataChange(options?.propertyKey);
      parentChange.changes.push(arrayItemChange);
      if (currentData.length > previousData.length) {
        arrayItemChange.itemsRemoved = true;
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
    return;
  }
  // Check object properties.
  if (typeof currentData === "object") {
    // Property is a object that should have its properties checked.
    if (!isEqual(currentData, previousData)) {
      const objectPropertyChange = new ApplicationDataChange(
        options?.propertyKey,
        undefined,
        undefined,
        options?.index,
      );
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
    return;
  }
  // Property is a changed leaf property.
  const newChange = new ApplicationDataChange(
    options.propertyKey,
    currentData,
    previousData,
    options?.index,
  );
  parentChange.changes.push(newChange);
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
