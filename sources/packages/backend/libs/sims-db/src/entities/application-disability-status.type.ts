/**
 * Application disability status.
 */
export enum ApplicationDisabilityStatus {
  yes = "yes",
  noIWantToAccessOtherFundingTypes = "noIWantToAccessOtherFundingTypes",
  noIDoNotHaveADisability = "noIDoNotHaveADisability",
}

/**
 * Application disability status description.
 */
export const ApplicationDisabilityStatusDescription: Record<
  ApplicationDisabilityStatus,
  string
> = {
  [ApplicationDisabilityStatus.yes]:
    "Yes, I identify as a student with a disability and have verified my Disability Status with StudentAid BC before. I want this application to be assessed for all funding types (including disability type funding).",
  [ApplicationDisabilityStatus.noIWantToAccessOtherFundingTypes]:
    "No, I have not verified my Disability Status with StudentAid BC and do not identify as a student with a disability at this time. I want this application to be assessed for other funding types while my Appendix 8 form is being processed to verify my Disability Status.",
  [ApplicationDisabilityStatus.noIDoNotHaveADisability]:
    "No, I will not verify my Disability Status with StudentAid BC. I want this application to be assessed for other funding types only (no disability type funding).",
};
