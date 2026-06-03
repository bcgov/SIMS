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
  createFakeStudentDisabilityProfileDisability,
  createFakeStudentDisabilityProfile,
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

describe("DisabilityProfileAESTController(e2e)-saveDraftProfile", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let ministryUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ministryUser = await getAESTUser(
      dataSource,
      AESTGroups.BusinessAdministrators,
    );
  });

  it("Should create a new disability draft profile when no existing draft is provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const endpoint = `/aest/disability-profile/student/${student.id}/draft`;
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
    const response = await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toEqual({
      id: expect.any(Number),
    });
    const savedDraft = await db.studentDisabilityProfile.findOne({
      select: {
        id: true,
        disabilityProfileStatus: true,
        student: { id: true },
        creator: { id: true },
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
        },
      },
      relations: {
        student: true,
        creator: true,
        completedBy: true,
        disabilities: true,
      },
      where: {
        id: response.body.id,
      },
      loadEagerRelations: false,
    });
    expect(savedDraft).toEqual({
      id: response.body.id,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
      student: { id: student.id },
      creator: { id: ministryUser.id },
      completedBy: null,
      completedAt: null,
      disabilities: [
        {
          id: expect.any(Number),
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

  it("Should update an existing disability draft profile when a draft ID is provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const existingDraft = await saveFakeStudentDisabilityProfile(db, {
      ministryUser,
      student,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
    });
    const [existingDisability] = existingDraft.disabilities;
    const endpoint = `/aest/disability-profile/student/${student.id}/draft`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      id: existingDraft.id,
      disabilities: [
        {
          id: existingDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: "Updated category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
        },
      ],
    };

    // Act
    const response = await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toEqual({
      id: existingDraft.id,
    });
    const updatedDraft = await db.studentDisabilityProfile.findOne({
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
        },
      },
      relations: {
        modifier: true,
        completedBy: true,
        disabilities: true,
      },
      where: {
        id: existingDraft.id,
      },
    });
    expect(updatedDraft).toMatchObject({
      id: existingDraft.id,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
      modifier: { id: ministryUser.id },
      completedBy: null,
      completedAt: null,
      disabilities: [
        {
          id: existingDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: "Updated category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "Updated final note.",
        },
      ],
    });
  });

  it("Should update an existing draft with two disabilities when only its priorities changed among themselves.", async () => {
    // Arrange
    const now = new Date();
    const student = await saveFakeStudent(db.dataSource);
    const [firstDisability, secondDisability] = [
      createFakeStudentDisabilityProfileDisability(
        {
          creator: ministryUser,
        },
        {
          initialValues: {
            disabilityPriority: 1,
            disabilityCategory: DisabilityCategories.SpeechImpairment,
            disabilityType: DisabilityTypes.PersistentOrProlonged,
            impairments: [DisabilityImpairments.FollowingInstructions],
          },
          now,
        },
      ),
      createFakeStudentDisabilityProfileDisability(
        {
          creator: ministryUser,
        },
        {
          initialValues: {
            disabilityPriority: 2,
            disabilityCategory: DisabilityCategories.LearningDisability,
            disabilityType: DisabilityTypes.Permanent,
            impairments: [DisabilityImpairments.AscendDescendStairs],
          },
          now,
        },
      ),
    ];
    const draftProfile = createFakeStudentDisabilityProfile(
      {
        student,
        creator: ministryUser,
        disabilities: [firstDisability, secondDisability],
      },
      {
        initialValues: {
          disabilityProfileStatus: DisabilityProfileStatus.Draft,
        },
        now,
      },
    );

    draftProfile.disabilities = [firstDisability, secondDisability];
    const existingDraft = await db.studentDisabilityProfile.save(draftProfile);

    const [savedFirstDisability, savedSecondDisability] =
      existingDraft.disabilities;
    const endpoint = `/aest/disability-profile/student/${student.id}/draft`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const payload = {
      id: existingDraft.id,
      disabilities: [
        {
          id: savedFirstDisability.id,
          disabilityPriority: 2,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          diagnosis: [DiagnosisSamples.SampleA],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "First final note UPDATED.",
        },
        {
          id: savedSecondDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Original category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Second diagnosis note.",
          impairments: [DisabilityImpairments.Other],
          impairmentsNotes: "Second impairments note.",
          finalNotes: "Second final note.",
        },
      ],
    };

    // Act
    const response = await request(app.getHttpServer())
      .put(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Assert
    expect(response.body).toEqual({
      id: existingDraft.id,
    });
    const updatedDraft = await db.studentDisabilityProfile.findOne({
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
        },
      },
      relations: {
        modifier: true,
        completedBy: true,
        disabilities: true,
      },
      where: {
        id: existingDraft.id,
      },
      order: { disabilities: { disabilityPriority: "ASC" } },
      loadEagerRelations: false,
    });
    const updatedDraftForAssertion = {
      id: updatedDraft?.id,
      disabilityProfileStatus: updatedDraft?.disabilityProfileStatus,
      modifier: updatedDraft?.modifier
        ? { id: updatedDraft.modifier.id }
        : null,
      completedBy: updatedDraft?.completedBy
        ? { id: updatedDraft.completedBy.id }
        : null,
      completedAt: updatedDraft?.completedAt,
      disabilities: updatedDraft?.disabilities.map((disability) => ({
        id: disability.id,
        disabilityPriority: disability.disabilityPriority,
        disabilityCategory: disability.disabilityCategory,
        disabilityType: disability.disabilityType,
        disabilityNotes: disability.disabilityNotes,
        diagnosis: disability.diagnosis,
        diagnosisNotes: disability.diagnosisNotes,
        impairments: disability.impairments,
        impairmentsNotes: disability.impairmentsNotes,
        finalNotes: disability.finalNotes,
      })),
    };
    expect(updatedDraftForAssertion).toEqual({
      id: existingDraft.id,
      disabilityProfileStatus: DisabilityProfileStatus.Draft,
      modifier: { id: ministryUser.id },
      completedBy: null,
      completedAt: null,
      disabilities: [
        {
          id: savedSecondDisability.id,
          disabilityPriority: 1,
          disabilityCategory: DisabilityCategories.LearningDisability,
          disabilityType: DisabilityTypes.Permanent,
          disabilityNotes: "Original category note.",
          diagnosis: [DiagnosisSamples.SampleB],
          diagnosisNotes: "Second diagnosis note.",
          impairments: [DisabilityImpairments.Other],
          impairmentsNotes: "Second impairments note.",
          finalNotes: "Second final note.",
        },
        {
          id: savedFirstDisability.id,
          disabilityPriority: 2,
          disabilityCategory: DisabilityCategories.SpeechImpairment,
          disabilityType: DisabilityTypes.PersistentOrProlonged,
          disabilityNotes: null,
          diagnosis: [DiagnosisSamples.SampleA],
          diagnosisNotes: "Updated diagnosis note.",
          impairments: [DisabilityImpairments.FollowingInstructions],
          impairmentsNotes: "Updated impairments note.",
          finalNotes: "First final note UPDATED.",
        },
      ],
    });
  });

  afterAll(async () => {
    await app?.close();
  });
});
