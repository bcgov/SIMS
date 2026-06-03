import {
  StudentDisabilityProfile,
  StudentDisabilityProfileDisability,
  User,
} from "@sims/sims-db";
import {
  DiagnosisSamples,
  DisabilityCategories,
  DisabilityImpairments,
  DisabilityTypes,
} from "@sims/test-utils/models/student-disability-profile.model";

export function createFakeStudentDisabilityProfileDisability(
  relations: {
    creator: User;
    studentDisabilityProfile?: StudentDisabilityProfile;
  },
  options?: {
    initialValues?: Partial<StudentDisabilityProfileDisability>;
    now?: Date;
  },
): StudentDisabilityProfileDisability {
  const now = options?.now ?? new Date();
  const disability = new StudentDisabilityProfileDisability();
  if (relations?.studentDisabilityProfile) {
    disability.studentDisabilityProfile = relations.studentDisabilityProfile;
  }
  disability.disabilityType = "Fake Disability Type";
  disability.disabilityPriority =
    options?.initialValues?.disabilityPriority ?? 1;
  disability.disabilityCategory =
    options?.initialValues?.disabilityCategory || DisabilityCategories.Other;
  disability.disabilityType =
    options?.initialValues?.disabilityType ||
    DisabilityTypes.PersistentOrProlonged;
  disability.disabilityNotes = "Some notes about the disability.";
  disability.impairments = options?.initialValues?.impairments || [
    DisabilityImpairments.Other,
  ];
  disability.impairmentsNotes = "Some notes about the impairments.";
  disability.diagnosis = [DiagnosisSamples.SampleA];
  disability.diagnosisNotes = "Some notes about the diagnosis.";
  disability.finalNotes = "Some final notes.";
  disability.deletedAt = undefined;
  disability.creator = relations.creator;
  disability.modifier = relations.creator;
  disability.createdAt = now;
  disability.updatedAt = now;
  return disability;
}
