import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
  getAESTUser,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeStudent,
  saveFakeStudentDisabilityProfile,
} from "@sims/test-utils";
import {
  DIAGNOSIS_NOTES_MAX_LENGTH,
  DISABILITY_NOTES_MAX_LENGTH,
  DisabilityProfileStatus,
  FINAL_NOTES_MAX_LENGTH,
  IMPAIRMENTS_NOTES_MAX_LENGTH,
  LOOKUP_KEY_MAX_LENGTH,
  User,
} from "@sims/sims-db";
import {
  DiagnosisSamples,
  DisabilityCategories,
  DisabilityImpairments,
  DisabilityTypes,
} from "@sims/test-utils";
import { faker } from "@faker-js/faker";
import MockDate from "mockdate";

describe("DisabilityProfileAESTController(e2e)-saveActiveProfile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;
  let nonDataPersistentErrorStudentEndpointURL: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
    const sharedStudentUnprocessableEntityErrors = await saveFakeStudent(
      db.dataSource,
    );
    nonDataPersistentErrorStudentEndpointURL = `/aest/disability-profile/student/${sharedStudentUnprocessableEntityErrors.id}/active`;
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should create a new active disability profile when there is no existing draft.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const student = await saveFakeStudent(db.dataSource);
    const endpoint = `/aest/disability-profile/student/${student.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Category other note.",
          diagnosis: [DiagnosisSamples.SampleA],
          diagnosisNotes: "Diagnosis note.",
          impairments: [DisabilityImpairments.Other],
          impairmentsNotes: "Impairment other note.",
          finalNotes: "Final note.",
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const savedActiveProfiles = await db.studentDisabilityProfile.find({
      select: {
        id: true,
        disabilityProfileStatus: true,
        student: { id: true },
        creator: { id: true },
        completedBy: { id: true },
        completedAt: true,
        disabilities: {
          disabilityPriority: true,
          disabilityCategory: true,
          disabilityType: true,
          disabilityNotes: true,
          diagnosis: true,
          diagnosisNotes: true,
          impairments: true,
          impairmentsNotes: true,
          finalNotes: true,
          createdAt: true,
          creator: { id: true },
        },
      },
      relations: {
        student: true,
        creator: true,
        completedBy: true,
        disabilities: { creator: true },
      },
      where: {
        student: { id: student.id },
        disabilityProfileStatus: DisabilityProfileStatus.Active,
      },
      order: { id: "DESC" },
      loadEagerRelations: false,
    });
    expect(savedActiveProfiles).toHaveLength(1);
    const [savedActiveProfile] = savedActiveProfiles;
    expect(savedActiveProfile).toEqual({
      id: expect.any(Number),
      disabilityProfileStatus: DisabilityProfileStatus.Active,
      student: { id: student.id },
      creator: { id: ministryUser.id },
      completedBy: { id: ministryUser.id },
      completedAt: now,
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Category other note.",
          diagnosis: [DiagnosisSamples.SampleA],
          diagnosisNotes: "Diagnosis note.",
          impairments: [DisabilityImpairments.Other],
          impairmentsNotes: "Impairment other note.",
          finalNotes: "Final note.",
          createdAt: now,
          creator: { id: ministryUser.id },
        },
      ],
    });
  });

  it("Should set an existing one-disability draft profile to active when the draft ID is provided, updating the existing disability and creating a new one.", async () => {
    // Arrange
    const draftCreationNow = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const existingDraft = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      student,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
      now: draftCreationNow,
    });
    const [existingDisability] = existingDraft.disabilities;
    const endpoint = `/aest/disability-profile/student/${student.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const profileCompletionNow = new Date();
    MockDate.set(profileCompletionNow);
    const payload = {
      id: existingDraft.id,
      disabilities: [
        {
          // Existing disability will be updated with the new values.
          id: existingDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
        },
        {
          // New disability to be created with the provided values.
          disabilityPriority: 2,
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Updated category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          impairments: [DisabilityImpairments.FollowingInstructions],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const updatedProfile = await db.studentDisabilityProfile.findOne({
      select: {
        id: true,
        disabilityProfileStatus: true,
        modifier: { id: true },
        completedBy: { id: true },
        completedAt: true,
        disabilities: {
          id: true,
          disabilityPriority: true,
          disabilityCategory: true,
          disabilityType: true,
          disabilityNotes: true,
          diagnosis: true,
          diagnosisNotes: true,
          impairments: true,
          impairmentsNotes: true,
          finalNotes: true,
          createdAt: true,
          creator: { id: true },
          updatedAt: true,
          modifier: { id: true },
        },
      },
      relations: {
        modifier: true,
        completedBy: true,
        disabilities: { creator: true, modifier: true },
      },
      where: {
        id: existingDraft.id,
      },
      order: { disabilities: { disabilityPriority: "ASC" } },
      loadEagerRelations: false,
    });
    expect(updatedProfile).toEqual({
      id: existingDraft.id,
      disabilityProfileStatus: DisabilityProfileStatus.Active,
      modifier: { id: ministryUser.id },
      completedBy: { id: ministryUser.id },
      completedAt: profileCompletionNow,
      disabilities: [
        {
          id: existingDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: null,
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
          createdAt: draftCreationNow,
          creator: { id: existingDisability.creator.id },
          updatedAt: profileCompletionNow,
          modifier: { id: ministryUser.id },
        },
        {
          id: expect.any(Number),
          disabilityPriority: 2,
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Updated category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: null,
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: null,
          finalNotes: null,
          createdAt: profileCompletionNow,
          creator: { id: ministryUser.id },
          updatedAt: expect.any(Date),
          modifier: null,
        },
      ],
    });
  });

  it("Should set an existing one-disability draft profile to active when the draft ID is provided and the existing disability is replaced by a new one.", async () => {
    // Arrange
    const draftCreationNow = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const existingDraft = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      student,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
      now: draftCreationNow,
    });
    // Existing disability will be deleted as it's not included in the payload, and a new one will be created.
    const [existingDisability] = existingDraft.disabilities;
    const endpoint = `/aest/disability-profile/student/${student.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const profileCompletionNow = new Date();
    MockDate.set(profileCompletionNow);
    const payload = {
      id: existingDraft.id,
      disabilities: [
        {
          // New disability to be created with the provided values, replacing the
          // existing disability as it's not included in the payload (id is not present).
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    const updatedProfile = await db.studentDisabilityProfile.findOne({
      select: {
        id: true,
        disabilityProfileStatus: true,
        modifier: { id: true },
        completedBy: { id: true },
        completedAt: true,
        disabilities: {
          id: true,
          disabilityPriority: true,
          disabilityCategory: true,
          disabilityType: true,
          disabilityNotes: true,
          diagnosis: true,
          diagnosisNotes: true,
          impairments: true,
          impairmentsNotes: true,
          finalNotes: true,
          createdAt: true,
          creator: { id: true },
          updatedAt: true,
          modifier: { id: true },
          deletedAt: true,
        },
      },
      relations: {
        modifier: true,
        completedBy: true,
        disabilities: { creator: true, modifier: true },
      },
      where: {
        id: existingDraft.id,
      },
      order: { disabilities: { id: "ASC" } },
      loadEagerRelations: false,
      withDeleted: true,
    });
    expect(updatedProfile).toEqual({
      id: existingDraft.id,
      disabilityProfileStatus: DisabilityProfileStatus.Active,
      modifier: { id: ministryUser.id },
      completedBy: { id: ministryUser.id },
      completedAt: profileCompletionNow,
      disabilities: [
        {
          // This record will not be updated, only marked as deleted.
          // The values must remain the ones originally created, except for the deletedAt and modifier fields.
          id: existingDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Some notes about the disability.",
          diagnosis: [DiagnosisSamples.SampleA],
          diagnosisNotes: "Some notes about the diagnosis.",
          impairments: [
            DisabilityImpairments.AscendDescendStairs,
            DisabilityImpairments.Other,
          ],
          impairmentsNotes: "Some notes about the impairments.",
          finalNotes: "Some final notes.",
          createdAt: draftCreationNow,
          creator: { id: ministryUser.id },
          updatedAt: profileCompletionNow,
          modifier: { id: ministryUser.id },
          deletedAt: profileCompletionNow,
        },
        {
          // Will be created with the provided values.
          id: expect.any(Number),
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: null,
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
          createdAt: profileCompletionNow,
          creator: { id: ministryUser.id },
          updatedAt: expect.any(Date),
          modifier: null,
          deletedAt: null,
        },
      ],
    });
  });

  it("Should throw an unprocessable entity error when trying to create a new active disability profile when there is an existing draft.", async () => {
    // Arrange
    // Create the draft profile that will cause the unprocessable entity error.
    const draftProfile = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
    });
    const endpoint = `/aest/disability-profile/student/${draftProfile.student.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `The student profile has a draft ${draftProfile.id} that must be completed or deleted before creating a new active profile.`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with disability priority not starting at 1.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 2,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };
    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Disability priorities must start at 1, be unique, and have no gaps in the sequence.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with disability priority starting at 1, but with some gaps in the sequence.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
        {
          disabilityPriority: 3,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };
    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Disability priorities must start at 1, be unique, and have no gaps in the sequence.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with disability priority starting at 1, but they have duplicated priorities.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };
    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Disability priorities must start at 1, be unique, and have no gaps in the sequence.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with a invalid category lookup.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.Invalid,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Invalid disability category: ${DisabilityCategories.Invalid}`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with a invalid category type lookup.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Invalid,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Invalid disability type: ${DisabilityTypes.Invalid}`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an unprocessable entity error when trying to create a new profile with a invalid impairment lookup.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [
            DisabilityImpairments.Invalid1,
            DisabilityImpairments.Invalid2,
          ],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Invalid disability impairment(s): ${DisabilityImpairments.Invalid1}, ${DisabilityImpairments.Invalid2}`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a bad request error when trying to create a new profile with category defined as OTHER without the required notes.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.Other,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [
            DisabilityImpairments.Invalid1,
            DisabilityImpairments.Invalid2,
          ],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message:
          "Disability category notes must be provided when category is OTHER.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when trying to create a new profile with impairments containing OTHER without the required notes.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [
            DisabilityImpairments.AscendDescendStairs,
            DisabilityImpairments.Other,
          ],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message:
          "Impairments notes must be provided when impairments includes OTHER.",
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when trying to create a new profile with duplicated impairments.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [
            DisabilityImpairments.AscendDescendStairs,
            DisabilityImpairments.AscendDescendStairs,
          ],
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["disabilities.0.All impairments's elements must be unique"],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when trying to create a new profile with empty notes.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
          disabilityNotes: "",
          diagnosisNotes: "",
          impairmentsNotes: "",
          finalNotes: "",
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "disabilities.0.disabilityNotes must be longer than or equal to 1 characters",
          "disabilities.0.diagnosisNotes must be longer than or equal to 1 characters",
          "disabilities.0.impairmentsNotes must be longer than or equal to 1 characters",
          "disabilities.0.finalNotes must be longer than or equal to 1 characters",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw a bad request error when trying to create a new profile with strings that are exceeding notes.", async () => {
    // Arrange
    const lookupKeyExceedingMaxLength = faker.string.alphanumeric(
      LOOKUP_KEY_MAX_LENGTH + 1,
    );
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: lookupKeyExceedingMaxLength,
          disabilityType: lookupKeyExceedingMaxLength,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [lookupKeyExceedingMaxLength],
          disabilityNotes: faker.string.alphanumeric(
            DISABILITY_NOTES_MAX_LENGTH + 1,
          ),
          diagnosisNotes: faker.string.alphanumeric(
            DIAGNOSIS_NOTES_MAX_LENGTH + 1,
          ),
          impairmentsNotes: faker.string.alphanumeric(
            IMPAIRMENTS_NOTES_MAX_LENGTH + 1,
          ),
          finalNotes: faker.string.alphanumeric(FINAL_NOTES_MAX_LENGTH + 1),
        },
      ],
    };

    // Act
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: [
          "disabilities.0.disabilityCategory must be shorter than or equal to 100 characters",
          "disabilities.0.disabilityType must be shorter than or equal to 100 characters",
          "disabilities.0.disabilityNotes must be shorter than or equal to 500 characters",
          "disabilities.0.diagnosisNotes must be shorter than or equal to 500 characters",
          "disabilities.0.each value in impairments must be shorter than or equal to 100 characters",
          "disabilities.0.impairmentsNotes must be shorter than or equal to 500 characters",
          "disabilities.0.finalNotes must be shorter than or equal to 1000 characters",
        ],
        error: "Bad Request",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  it("Should throw an unprocessable entity error when trying to complete a draft profile but the draft ID is invalid.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      id: 99999,
      disabilities: [
        {
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          diagnosis: [DiagnosisSamples.SampleA],
          impairments: [DisabilityImpairments.AscendDescendStairs],
        },
      ],
    };

    // Act/Assert
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Draft disability profile ID 99999 not found to be updated to complete.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw a forbidden error when the user does not have permission.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.Operations);

    // Act/Assert
    await request(app.getHttpServer())
      .put(nonDataPersistentErrorStudentEndpointURL)
      .send({})
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "Forbidden resource",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
