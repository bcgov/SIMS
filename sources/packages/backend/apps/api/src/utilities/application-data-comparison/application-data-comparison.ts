import { diff, IChange } from "json-diff-ts";

export class ApplicationChange {
  constructor(
    readonly key?: string,
    readonly newValue?: unknown,
    readonly oldValue?: unknown,
    readonly index?: number,
  ) {
    this.changes = [];
  }
  changes: ApplicationChange[];
}

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
  if (Array.isArray(newData) && Array.isArray(previousData)) {
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
    return;
  }
  // Check object properties.
  if (typeof newData === "object") {
    // Property is a object that should have its properties checked.
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

export function compareApplicationDataLib(
  dataA: unknown,
  dataB: unknown,
): IChange[] {
  return diff(dataA, dataB);
}

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
