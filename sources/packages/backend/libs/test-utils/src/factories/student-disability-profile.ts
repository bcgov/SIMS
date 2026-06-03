import {
  DisabilityProfileStatus,
  Student,
  StudentDisabilityProfile,
  StudentDisabilityProfileDisability,
  User,
} from "@sims/sims-db";
import {
  createFakeStudentDisabilityProfileDisability,
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import {
  DisabilityCategories,
  DisabilityTypes,
  DisabilityImpairments,
} from "@sims/test-utils";

/**
 * Creates a fake student disability profile for testing purposes.
 * @param relations the related entities required to create the profile.
 * - `student`: the student to whom the profile belongs.
 * - `creator`: the user who created the profile.
 * - `completedBy`: the user who completed the profile, if applicable.
 * - `disabilities`: the disabilities associated with the profile.
 * @param options optional parameters to customize the created profile.
 * - `initialValues`: allows overriding specific fields of the created profile.
 * - `now`: allows setting a specific date for createdAt and updatedAt fields.
 * @returns a fake student disability profile ready to be saved to the database.
 */
export function createFakeStudentDisabilityProfile(
  relations: {
    student: Student;
    creator: User;
    completedBy?: User;
    disabilities?: StudentDisabilityProfileDisability[];
  },
  options?: {
    initialValues?: Partial<StudentDisabilityProfile>;
    now?: Date;
  },
): StudentDisabilityProfile {
  const now = options?.now ?? new Date();
  const disabilityProfile = new StudentDisabilityProfile();
  disabilityProfile.student = relations.student;
  disabilityProfile.disabilityProfileStatus =
    options?.initialValues?.disabilityProfileStatus ??
    DisabilityProfileStatus.Draft;
  disabilityProfile.completedBy = relations?.completedBy;
  disabilityProfile.completedAt = options?.initialValues?.completedAt;
  disabilityProfile.creator = relations.creator ?? relations.student?.user;
  disabilityProfile.createdAt = now;
  disabilityProfile.updatedAt = now;
  disabilityProfile.deletedAt = options?.initialValues?.deletedAt;
  disabilityProfile.disabilities = relations.disabilities ?? [];
  return disabilityProfile;
}

/**
 * Saves a fake student disability profile to the database for testing purposes.
 * @param db E2E testing data sources.
 * @param options the options to customize the created profile.
 * - `ministryUser`: the user who is performing the operation.
 * - `student`: the student to whom the profile belongs.
 * - `disabilityProfileStatus`: the status of the disability profile.
 * - `disabilities`: the disabilities associated with the profile.
 * - `now`: allows setting a specific date for createdAt and updatedAt fields.
 * @returns the saved student disability profile.
 */
export async function saveFakeStudentDisabilityProfile(
  db: E2EDataSources,
  options: {
    ministryUser: User;
    student?: Student;
    disabilityProfileStatus?: DisabilityProfileStatus;
    now?: Date;
  },
): Promise<StudentDisabilityProfile> {
  const now = options?.now ?? new Date();
  const disabilityProfileStatus =
    options?.disabilityProfileStatus ?? DisabilityProfileStatus.Active;
  const student = options?.student ?? (await saveFakeStudent(db.dataSource));
  const disabilities = [
    createFakeStudentDisabilityProfileDisability(
      {
        creator: options.ministryUser,
      },
      {
        initialValues: {
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          impairments: [
            DisabilityImpairments.AscendDescendStairs,
            DisabilityImpairments.Other,
          ],
        },
        now,
      },
    ),
  ];
  const studentDisabilityProfile = createFakeStudentDisabilityProfile(
    {
      student,
      creator: options.ministryUser,
      disabilities,
    },
    {
      initialValues: {
        disabilityProfileStatus,
      },
      now,
    },
  );
  if (disabilityProfileStatus !== DisabilityProfileStatus.Draft) {
    studentDisabilityProfile.completedBy = options?.ministryUser;
    studentDisabilityProfile.completedAt = now;
  }
  return db.studentDisabilityProfile.save(studentDisabilityProfile);
}
