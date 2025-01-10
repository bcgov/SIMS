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
   * An object had at least one property removed.
   */
  PropertiesRemoved = "propertiesRemoved",
}
