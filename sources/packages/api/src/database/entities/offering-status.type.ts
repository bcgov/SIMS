/**
 * Represents the status of an offering.
 ** Offering statuses are grouped into the ones which are exclusively for offering creation
 ** and exclusively for offering change.
 ** Approved is a status which is common in both offering creation and offering change.
 ** Except approved all other statuses belong to either offering creation or offering change perspective.
 ** Offering creation is when the offering is created or modified by the institution and ministry either approves
 ** or declines the same if required.
 ** Offering change is when an approved offering is requested for change by the institution and ministry either approves
 ** or declines the same.
 */
export enum OfferingStatus {
  Approved = "Approved",
  // Status with respect to offering creation.
  CreationPending = "Creation pending",
  CreationDeclined = "Creation declined",
  // Status with respect to offering change.
  ChangeUnderReview = "Change under review",
  ChangeAwaitingApproval = "Change awaiting approval",
  ChangeOverwritten = "Change overwritten",
  ChangeDeclined = "Change declined",
}
