import { StudentDisabilityProfile } from "@sims/sims-db";
import {
  DisabilityCategories,
  DisabilityCategoryDescriptions,
  DisabilityTypes,
  DiagnosisSamples,
  DisabilityImpairments,
} from "@sims/test-utils/models/student-disability-profile.model";

export function createExpectedProfile(
  disabilityProfile: StudentDisabilityProfile,
) {
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
        disabilityCategory: DisabilityCategories.LearningDisability,
        disabilityCategoryDescription:
          DisabilityCategoryDescriptions.LearningDisability,
        disabilityType: DisabilityTypes.Permanent,
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
