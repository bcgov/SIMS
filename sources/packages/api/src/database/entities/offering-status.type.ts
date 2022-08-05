/**
 * Represents the status of an offering.
 */
export enum OfferingStatus {
  Approved = "Approved",
  // Status with respect to offering creation.
  CreationPending = "Creation pending",
  CreationDeclined = "Creation declined",
  // Status with respect to offering creation.
  ChangeUnderReview = "Change under review",
  ChangeAwaitingApproval = "Change awaiting approval",
  ChangeOverwritten = "Change overwritten",
  ChangeDeclined = "Change declined",
}
