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
  createFakeUser,
  E2EDataSources,
  getProviderInstanceForModule,
  saveFakeSFASIndividual,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { CreateStudentAPIInDTO } from "../../../../route-controllers";
import { IdentityProviders, NoteType } from "@sims/sims-db";
import { FormNames, FormService } from "../../../../services";
import { RestrictionCode, SystemUsersService } from "@sims/services";
import { AppStudentsModule } from "../../../../app.students.module";
import { In } from "typeorm";

const SIN_NUMBER_PARTIAL_MATCH = "123456789";

describe("StudentStudentsController(e2e)-create-with-partial-match", () => {
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
      { sin: In([SIN_NUMBER_PARTIAL_MATCH]) },
      { sin: "000000000" },
    );
  });

  it("Should create a BCSC student with HOLD restriction and note when SFAS partial match exists and note should have a creator.", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    const payload = createStudentPayload({
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

  it("Should create a BCSC student with HOLD restriction when SFAS partial match exists (lastName and SIN match, different birthDate).", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    const payload = createStudentPayload({
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

    // Create a SFAS individual that will PARTIALLY match.
    // Match: lastName and SIN.
    // No match: birthDate (different birthDate).
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: user.lastName,
        birthDate: "1995-06-15", // Different birthDate - this creates a partial match.
        sin: SIN_NUMBER_PARTIAL_MATCH,
      },
    });

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, { ...user, birthDate: birthDate });

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
      });

    // Assert - Verify HOLD restriction and note were created with creator.
    const holdRestriction = await db.studentRestriction.findOne({
      select: {
        id: true,
        restrictionNote: {
          id: true,
          creator: { id: true },
        },
      },
      relations: {
        restrictionNote: { creator: true },
      },
      where: {
        student: { id: studentId },
        restriction: { restrictionCode: RestrictionCode.HOLD },
      },
    });

    expect(holdRestriction).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        restrictionNote: expect.objectContaining({
          id: expect.any(Number),
          creator: expect.objectContaining({
            id: systemUserId,
          }),
        }),
      }),
    );
  });

  it("Should create a BCSC student with HOLD restriction when SFAS partial match exists (SIN and birthDate match, different lastName).", async () => {
    // Arrange
    const birthDate = "2000-01-01";
    const payload = createStudentPayload({
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

    // Create a SFAS individual that will PARTIALLY match.
    // Match: SIN and birthDate.
    // No match: lastName (different lastName).
    await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: "DifferentLastName", // Different lastName - this creates a partial match.
        birthDate,
        sin: SIN_NUMBER_PARTIAL_MATCH,
      },
    });

    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, { ...user, birthDate: birthDate });

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
      });

    // Assert - Verify HOLD restriction and note were created with creator.
    const holdRestriction = await db.studentRestriction.findOne({
      select: {
        id: true,
        restrictionNote: {
          id: true,
          creator: { id: true },
        },
      },
      relations: {
        restrictionNote: { creator: true },
      },
      where: {
        student: { id: studentId },
        restriction: { restrictionCode: RestrictionCode.HOLD },
      },
    });

    expect(holdRestriction).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        restrictionNote: expect.objectContaining({
          id: expect.any(Number),
          creator: expect.objectContaining({
            id: systemUserId,
          }),
        }),
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Create valid student creation payload.
 * @param options options to create the payload.
 * - `sinNumber` SIN number to be used in the payload.
 * @returns student creation payload.
 */
function createStudentPayload(options: {
  sinNumber: string;
}): CreateStudentAPIInDTO {
  const payload: CreateStudentAPIInDTO = {
    mode: "student-create",
    identityProvider: IdentityProviders.BCSC,
    country: "Canada",
    selectedCountry: "Canada",
    provinceState: "BC",
    city: "Vancouver",
    addressLine1: "123 Main St",
    postalCode: "V5K0A1",
    canadaPostalCode: "V5K0A1",
    phone: "123-456-7890",
    sinNumber: options.sinNumber,
    sinConsent: true,
    gender: "X",
  };
  return payload;
}
