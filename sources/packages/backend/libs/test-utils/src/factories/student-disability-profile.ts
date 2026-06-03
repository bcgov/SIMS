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
} from "@sims/test-utils/models/student-disability-profile.model";

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

export async function saveFakeStudentDisabilityProfile(
  db: E2EDataSources,
  options: {
    ministryUser: User;
    student?: Student;
    disabilityProfileStatus?: DisabilityProfileStatus;
    disabilities?: StudentDisabilityProfileDisability[];
    now?: Date;
  },
): Promise<StudentDisabilityProfile> {
  const now = options?.now ?? new Date();
  const disabilityProfileStatus =
    options?.disabilityProfileStatus ?? DisabilityProfileStatus.Active;
  const student = options?.student ?? (await saveFakeStudent(db.dataSource));
  const disabilities = options?.disabilities ?? [
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
