import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  createFakeSFASApplication,
  createFakeSFASRestriction,
  createFakeUser,
  createFakeStudentPayload,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { FormNames, FormService } from "../../../../services";
import { RestrictionCode, SystemUsersService } from "@sims/services";
import { AppStudentsModule } from "../../../../app.students.module";
import { In } from "typeorm";
import { NoteType } from "@sims/sims-db";

const SIN_NUMBER_A = "544962244";
const SIN_NUMBER_B = "317149003";
const SIN_NUMBER_PARTIAL_MATCH = "123456789";

describe("StudentStudentsController(e2e)-create", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let appModule: TestingModule;
  let formService: FormService;
  let systemUserId: number;
  const endpoint = "/students/student";

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    appModule = module;
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    systemUserId = app.get(SystemUsersService).systemUser.id;
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
    await db.sinValidation.update(
      { sin: In([SIN_NUMBER_A, SIN_NUMBER_B, SIN_NUMBER_PARTIAL_MATCH]) },
      { sin: "000000000" },
    );
  });

  it("Should create a BCSC student for the first time when a valid payload is submitted and the student has no data that matches any other student in SIMS or SFAS.", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    // Student creation payload.
    const payload = createFakeStudentPayload({ sinNumber: SIN_NUMBER_A });
    // Mocked user info to populate the JWT token.
    const user = createFakeUser();
    // Form.io mock.
    const dryRunSubmissionMock = jest.fn().mockResolvedValueOnce({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, { ...user, birthDate: birthDate });
    // Get any student user token. The properties required for student creation
    // are provided by the mocked user info and overridden using mockJWTUserInfo.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    let studentId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        studentId = response.body.id;
        expect(studentId).toBeGreaterThan(0);
      });
    // Basic student creation validation.
    const createdStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        gender: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          userName: true,
        },
        sinConsent: true,
        sinValidation: { id: true, sin: true },
      },
      relations: { user: true, sinValidation: true },
      where: { id: studentId },
      loadEagerRelations: false,
    });
    expect(createdStudent).toEqual({
      id: studentId,
      birthDate: birthDate,
      gender: payload.gender,
      sinConsent: true,
      user: {
        id: expect.any(Number),
        firstName: user.firstName,
        lastName: user.lastName,
        userName: user.userName,
      },
      sinValidation: {
        id: expect.any(Number),
        sin: SIN_NUMBER_A,
      },
    });
  });

  it("Should create a BCSC student, setting the SFAS restriction-related data to be reprocessed when a valid payload is submitted and the student has a SFAS match.", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    // Student creation payload.
    const payload = createFakeStudentPayload({ sinNumber: SIN_NUMBER_B });
    // Mocked user info to populate the JWT token.
    const user = createFakeUser();
    // Form.io mock.
    const dryRunSubmissionMock = jest.fn().mockResolvedValueOnce({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Create the SFAS individual that will match the student being created.
    // Last name, will always be random, which will avoid conflicts with other tests.
    const legacyProfileMatch = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate,
        sin: SIN_NUMBER_B,
      },
    });
    // Create processed SFAS restriction to validate update.
    const processedSFASRestriction = createFakeSFASRestriction({
      initialValues: {
        individualId: legacyProfileMatch.id,
        processed: true,
      },
    });
    // Create processed SFAS application to validate update.
    const processedSFASApplication = createFakeSFASApplication(
      { individual: legacyProfileMatch },
      {
        initialValues: { wthdProcessed: true },
      },
    );
    await Promise.all([
      db.sfasApplication.save(processedSFASApplication),
      db.sfasRestriction.save(processedSFASRestriction),
    ]);
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, { ...user, birthDate: birthDate });
    // Get any student user token. The properties required for student creation
    // are provided by the mocked user info and overridden using mockJWTUserInfo.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    let studentId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        studentId = response.body.id;
        expect(studentId).toBeGreaterThan(0);
      });
    // Validates restriction update.
    const updatedSFASRestriction = await db.sfasRestriction.findOne({
      select: {
        id: true,
        processed: true,
      },
      where: {
        id: processedSFASRestriction.id,
      },
    });
    expect(updatedSFASRestriction.processed).toBe(false);
    // Validates SFAS applications wthdProcessed update.
    const updatedSFASApplication = await db.sfasApplication.findOne({
      select: {
        id: true,
        wthdProcessed: true,
      },
      where: {
        id: processedSFASApplication.id,
      },
    });
    expect(updatedSFASApplication.wthdProcessed).toBe(false);
  });

  it("Should create a BCSC student with HOLD restriction and note when SFAS partial match exists and note should have a creator.", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    const payload = createFakeStudentPayload({
      sinNumber: SIN_NUMBER_PARTIAL_MATCH,
    });
    const user = createFakeUser();

    // Form.io mock.
    const dryRunSubmissionMock = jest.fn().mockResolvedValueOnce({
      valid: true,
      formName: FormNames.StudentProfile,
      data: { data: payload },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;

    // Create a SFAS individual that will PARTIALLY match (only 2 out of 3 fields match).
    // Match: lastName and birthDate.
    // No match: SIN (different SIN).
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate,
        sin: "987654321", // Different SIN - this creates a partial match.
      },
    });

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, { ...user, birthDate: birthDate });

    // Get any student user token. The properties required for student creation
    // are provided by the mocked user info and overridden using mockJWTUserInfo.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act
    let studentId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        studentId = response.body.id;
        expect(studentId).toBeGreaterThan(0);
      });

    // Assert - Verify student was created.
    const createdStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        user: {
          id: true,
          lastName: true,
        },
      },
      relations: { user: true },
      where: { id: studentId },
      loadEagerRelations: false,
    });

    expect(createdStudent).toEqual({
      id: studentId,
      birthDate: birthDate,
      user: {
        id: expect.any(Number),
        lastName: user.lastName,
      },
    });

    const holdRestriction = await db.studentRestriction.findOne({
      select: {
        id: true,
        restriction: { id: true, restrictionCode: true },
        student: { id: true },
        isActive: true,
        restrictionNote: {
          id: true,
          description: true,
          noteType: true,
          creator: { id: true, userName: true },
        },
      },
      relations: {
        restriction: true,
        student: true,
        restrictionNote: { creator: true },
      },
      where: {
        student: { id: studentId },
        restriction: { restrictionCode: RestrictionCode.HOLD },
      },
    });

    // Assert - Verify the creator is set to a system user.
    expect(holdRestriction).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        isActive: true,
        restriction: expect.objectContaining({
          id: expect.any(Number),
          restrictionCode: RestrictionCode.HOLD,
        }),
        student: expect.objectContaining({
          id: studentId,
        }),
        restrictionNote: expect.objectContaining({
          id: expect.any(Number),
          description:
            "Restriction added to prevent application completion while potential partial match exists",
          noteType: NoteType.Restriction,
          creator: expect.objectContaining({
            id: systemUserId,
            userName: expect.any(String),
          }),
        }),
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
