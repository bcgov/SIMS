export enum ChangeTypes {
  /**
   * Indicates that a new value was added or updated.
   */
  Update = "updated",
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
