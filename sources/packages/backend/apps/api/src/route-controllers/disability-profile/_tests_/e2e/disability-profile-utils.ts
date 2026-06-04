import { StudentDisabilityProfile } from "@sims/sims-db";
import {
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
  return {
    id: disabilityProfile.id,
    status: disabilityProfile.disabilityProfileStatus,
    completedBy: disabilityProfile.completedBy
      ? `${disabilityProfile.completedBy.firstName} ${disabilityProfile.completedBy.lastName}`
      : undefined,
    completedAt: disabilityProfile.completedAt
      ? disabilityProfile.completedAt.toISOString()
      : null,
    disabilities: disabilityProfile.disabilities.map((disability) => ({
      id: disability.id,
      disabilityPriority: disability.disabilityPriority,
      disabilityCategory: disability.disabilityCategory,
      disabilityCategoryDescription:
        DISABILITY_CATEGORY_DESCRIPTIONS[
          disability.disabilityCategory as DisabilityCategories
        ],
      disabilityType: disability.disabilityType,
      disabilityNotes: disability.disabilityNotes,
      diagnosis: disability.diagnosis,
      diagnosisNotes: disability.diagnosisNotes,
      impairments: disability.impairments,
      impairmentsNotes: disability.impairmentsNotes,
      finalNotes: disability.finalNotes,
    })),
    creator: `${disabilityProfile.creator.firstName} ${disabilityProfile.creator.lastName}`,
    createdAt: disabilityProfile.createdAt.toISOString(),
    updatedAt: disabilityProfile.updatedAt.toISOString(),
  };
}
