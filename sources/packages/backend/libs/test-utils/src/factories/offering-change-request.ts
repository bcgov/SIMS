import { EducationProgramOffering, OfferingStatus } from "@sims/sims-db";

/**
 * Create a fake offering request change.
 * @param options options:
 *  - `currentOffering` current offering, which is requested for the changed, which is
 * already saved in the DB.
 * @returns the current and requested offering.
 */
export function createFakeOfferingRequestChange(options: {
  currentOffering: EducationProgramOffering;
}): EducationProgramOffering[] {
  const now = new Date();
  const requestedOfferingId = options.currentOffering.id;
  const requestedOffering = options.currentOffering;
  delete requestedOffering.id;
  requestedOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
  requestedOffering.parentOffering =
    options.currentOffering.parentOffering ??
    ({ id: requestedOfferingId } as EducationProgramOffering);
  requestedOffering.precedingOffering = {
    id: requestedOfferingId,
  } as EducationProgramOffering;
  requestedOffering.createdAt = now;
  requestedOffering.submittedDate = now;

  // Update the status and audit details of current offering.
  const precedingOffering = new EducationProgramOffering();
  precedingOffering.id = requestedOfferingId;
  precedingOffering.offeringStatus = OfferingStatus.ChangeUnderReview;
  precedingOffering.updatedAt = now;
  return [precedingOffering, requestedOffering];
}
