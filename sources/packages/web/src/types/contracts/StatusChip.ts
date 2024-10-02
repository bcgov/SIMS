/**
 * This represents the color of the icon and the outline of chips representing the requests for application changes that may require reassessment.
 */
export enum StatusChipTypes {
  Success = "success",
  Warning = "warning",
  Error = "error",
  Default = "black",
  Inactive = "inactive",
}

/**
 * This is the label representing the status of requests for application changes that may require reassessment.
 */
export enum StatusChipLabelTypes {
  Pending = "Pending",
  Declined = "Declined",
  Completed = "Completed",
}

/**
 * Indicates if the bypassed restriction is active or removed.
 */
export enum BypassStatusChipLabelTypes {
  /**
   * Application restriction bypass is active.
   */
  Active = "Active",
  /**
   * Application restriction bypass is removed.
   */
  Removed = "Removed",
}
