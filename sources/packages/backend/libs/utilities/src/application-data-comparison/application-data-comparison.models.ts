export enum ChangeTypes {
  /**
   * Indicates that a new value was added or updated.
   */
  Updated = "updated",
  /**
   * An array had at least one property removed.
   */
  ItemsRemoved = "itemsRemoved",
  /**
   * Items were added to the end of the array.
   */
  ItemsAppended = "itemsAppended",
  /**
   * An object had at least one property removed.
   */
  PropertiesRemoved = "propertiesRemoved",
}

export class ApplicationDataChange {
  readonly key?: string;
  readonly newValue?: unknown;
  readonly oldValue?: unknown;
  readonly index?: number;

  constructor(options?: {
    key?: string;
    newValue?: unknown;
    oldValue?: unknown;
    index?: number;
  }) {
    this.key = options?.key;
    this.newValue = options?.newValue;
    this.oldValue = options?.oldValue;
    this.index = options?.index;
    this.changeType = ChangeTypes.Updated;
    this.changes = [];
  }

  changeType: ChangeTypes;
  changes: ApplicationDataChange[];
}
