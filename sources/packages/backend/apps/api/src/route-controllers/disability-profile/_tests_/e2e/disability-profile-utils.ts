import { StudentDisabilityProfile } from "@sims/sims-db";
import {
  DiagnosisSamples,
  DisabilityImpairments,
  DISABILITY_CATEGORY_DESCRIPTIONS,
  DisabilityCategories,
} from "@sims/test-utils";

/**
 * Creates an expected profile object based on the given disability profile.
 * @param disabilityProfile The disability profile to create the expected profile from.
 * @returns the expected profile object.
 */
export function createExpectedProfile(
  disabilityProfile: StudentDisabilityProfile,
): unknown {
  const disability = disabilityProfile.disabilities[0];
  return {
    id: disabilityProfile.id,
    status: disabilityProfile.disabilityProfileStatus,
    completedBy: disabilityProfile.completedBy
      ? `${disabilityProfile.completedBy.firstName} ${disabilityProfile.completedBy.lastName}`
      : undefined,
    completedAt: disabilityProfile.completedAt
      ? disabilityProfile.completedAt.toISOString()
      : null,
    disabilities: [
      {
        id: disability.id,
        disabilityPriority: disability.disabilityPriority,
        disabilityCategory: disability.disabilityCategory,
        disabilityCategoryDescription:
          DISABILITY_CATEGORY_DESCRIPTIONS[
            disability.disabilityCategory as DisabilityCategories
          ],
        disabilityType: disability.disabilityType,
        disabilityNotes: disability.disabilityNotes,
        diagnosis: [DiagnosisSamples.SampleA],
        diagnosisNotes: disability.diagnosisNotes,
        impairments: [
          DisabilityImpairments.AscendDescendStairs,
          DisabilityImpairments.Other,
        ],
        impairmentsNotes: disability.impairmentsNotes,
        finalNotes: disability.finalNotes,
      },
    ],
    creator: `${disabilityProfile.creator.firstName} ${disabilityProfile.creator.lastName}`,
    createdAt: disabilityProfile.createdAt.toISOString(),
    updatedAt: disabilityProfile.updatedAt.toISOString(),
  };
}
