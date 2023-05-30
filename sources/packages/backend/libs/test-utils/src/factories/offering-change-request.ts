import { EducationProgramOffering, OfferingStatus } from "@sims/sims-db";

/**
 * Create a fake offering request change.
 * @param relations dependencies:
 *  - `currentOffering` current offering, which is requested for the changed.
 * @returns the current and requested offering.
 */
export function createFakeOfferingRequestChange(relations: {
  currentOffering: EducationProgramOffering;
}): EducationProgramOffering[] {
  const now = new Date();
  const requestedOfferingId = relations.currentOffering.id;
  let requestedOffering = new EducationProgramOffering();
  requestedOffering = relations.currentOffering;
  delete requestedOffering.id;
  requestedOffering.offeringStatus = OfferingStatus.ChangeAwaitingApproval;
  requestedOffering.parentOffering =
    relations.currentOffering.parentOffering ??
    ({ id: requestedOfferingId } as EducationProgramOffering);
  requestedOffering.precedingOffering = {
    id: requestedOfferingId,
  } as EducationProgramOffering;
  requestedOffering.createdAt = now;

  // Update the status and audit details of current offering.
  const precedingOffering = new EducationProgramOffering();
  precedingOffering.id = requestedOfferingId;
  precedingOffering.offeringStatus = OfferingStatus.ChangeUnderReview;
  precedingOffering.updatedAt = now;
  return [precedingOffering, requestedOffering];
}
