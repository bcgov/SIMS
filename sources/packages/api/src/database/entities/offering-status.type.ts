/**
 * Represents the status of an offering.
 */
export enum OfferingStatus {
  Approved = "Approved",
  //This status will be changed to CreationPending.
  Pending = "Pending",
  //This status will be changed to CreationDeclined.
  Declined = "Declined",
  //This status will be changed to CreationUnderReview.
  UnderReview = "Under review",
  //This status will be changed to CreationAwaitingApproval.
  AwaitingApproval = "Awaiting approval",
  ChangeOverwritten = "Change overwritten",
  ChangeDeclined = "Change declined",
}
