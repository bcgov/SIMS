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
import { DisabilityProfileStatus, User } from "@sims/sims-db";
import {
  DiagnosisSamples,
  DisabilityCategories,
  DisabilityImpairments,
  DisabilityTypes,
} from "@sims/test-utils/models/student-disability-profile.model";

describe("DisabilityProfileAESTController(e2e)-saveActiveProfile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;
  let unprocessableEntityStudentEndpointURL: string;

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
    unprocessableEntityStudentEndpointURL = `/aest/disability-profile/student/${sharedStudentUnprocessableEntityErrors.id}/active`;
  });

  it("Should create a new active disability profile when there is no existing draft.", async () => {
    // Arrange
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
        },
      },
      relations: {
        student: true,
        creator: true,
        completedBy: true,
        disabilities: true,
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
      completedAt: expect.any(Date),
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
    });
  });

  it("Should set an existing one-disability draft profile to active when the draft ID is provided, updating the existing disability and creating a new one.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const existingDraft = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      student,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
    });
    const [existingDisability] = existingDraft.disabilities;
    const endpoint = `/aest/disability-profile/student/${student.id}/active`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      id: existingDraft.id,
      disabilities: [
        {
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
      completedAt: expect.any(Date),
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
          createdAt: expect.any(Date),
          creator: { id: existingDisability.creator!.id },
          updatedAt: expect.any(Date),
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
          createdAt: expect.any(Date),
          creator: { id: ministryUser.id },
          updatedAt: expect.any(Date),
          modifier: null,
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
      .put(unprocessableEntityStudentEndpointURL)
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
      .put(unprocessableEntityStudentEndpointURL)
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
    // Act
    await request(app.getHttpServer())
      .put(unprocessableEntityStudentEndpointURL)
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
      .put(unprocessableEntityStudentEndpointURL)
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
      .put(unprocessableEntityStudentEndpointURL)
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
      .put(unprocessableEntityStudentEndpointURL)
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
      .put(unprocessableEntityStudentEndpointURL)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: `Invalid disability impairment(s): ${DisabilityImpairments.Invalid1}, ${DisabilityImpairments.Invalid2}`,
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
