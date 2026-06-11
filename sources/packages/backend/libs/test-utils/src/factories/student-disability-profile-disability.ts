import { StudentDisabilityProfileDisability, User } from "@sims/sims-db";
import {
  DiagnosisSamples,
  DisabilityCategories,
  DisabilityImpairments,
  DisabilityTypes,
} from "@sims/test-utils";

/**
 * Creates a fake student disability profile disability for testing purposes.
 * @param relations the related entities required to create the disability.
 * - `creator`: the user who created the disability entry.
 * @param options optional parameters to customize the created disability.
 * - `initialValues`: allows overriding specific fields of the created disability.
 * - `now`: allows setting a specific date for createdAt and updatedAt fields.
 * @returns a fake disability ready to be saved to the database.
 */
export function createFakeStudentDisabilityProfileDisability(
  relations: {
    creator: User;
  },
  options?: {
    initialValues?: Partial<StudentDisabilityProfileDisability>;
    now?: Date;
  },
): StudentDisabilityProfileDisability {
  const now = options?.now ?? new Date();
  const disability = new StudentDisabilityProfileDisability();
  disability.disabilityPriority =
    options?.initialValues?.disabilityPriority ?? 1;
  disability.disabilityCategory =
    options?.initialValues?.disabilityCategory ?? DisabilityCategories.Other;
  disability.disabilityType =
    options?.initialValues?.disabilityType ??
    DisabilityTypes.PersistentOrProlonged;
  disability.disabilityNotes =
    options?.initialValues?.disabilityNotes ??
    "Some notes about the disability.";
  disability.impairments = options?.initialValues?.impairments ?? [
    DisabilityImpairments.Other,
  ];
  disability.impairmentsNotes =
    options?.initialValues?.impairmentsNotes ??
    "Some notes about the impairments.";
  disability.diagnosis = options?.initialValues?.diagnosis ?? [
    DiagnosisSamples.SampleA,
  ];
  disability.diagnosisNotes =
    options?.initialValues?.diagnosisNotes ?? "Some notes about the diagnosis.";
  disability.finalNotes =
    options?.initialValues?.finalNotes ?? "Some final notes.";
  disability.deletedAt = undefined;
  disability.creator = relations.creator;
  disability.createdAt = now;
  disability.updatedAt = now;
  return disability;
}
