import { HttpStatus, INestApplication } from "@nestjs/common";
import request from "supertest";
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
  E2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { IdentityProviders } from "@sims/sims-db";
import { UpdateStudentAPIInDTO } from "../../models/student.dto";

describe("StudentStudentsController(e2e)-update", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let db: E2EDataSources;
  const endpoint = "/students/student";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    db = createE2EDataSources(dataSource);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
  });

  it.each([IdentityProviders.BCSC, IdentityProviders.BCeIDBoth])(
    "Should update the student contact and gender information when the payload has no identity fields and the identity provider is %s.",
    async (identityProvider: IdentityProviders) => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      await mockJWTUserInfo(appModule, student.user);
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const payload: UpdateStudentAPIInDTO = {
        mode: "student-edit",
        identityProvider,
        phone: "2505551234",
        gender: "nonBinary",
        addressLine1: "123 Some Street",
        addressLine2: "Unit 2",
        city: "Victoria",
        provinceState: "BC",
        country: "Canada",
        selectedCountry: "Canada",
        postalCode: "V8V1V1",
        canadaPostalCode: "V8V1V1",
      };

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK);

      const updatedStudent = await db.student.findOneOrFail({
        select: { id: true, gender: true, contactInfo: true },
        where: { id: student.id },
      });
      expect(updatedStudent.gender).toBe(payload.gender);
      expect(updatedStudent.contactInfo.phone).toBe(payload.phone);
      expect(updatedStudent.contactInfo.address).toEqual(
        expect.objectContaining({
          addressLine1: payload.addressLine1,
          addressLine2: payload.addressLine2,
          city: payload.city,
          provinceState: payload.provinceState,
          country: payload.country,
          postalCode: payload.postalCode,
        }),
      );
    },
  );

  it("Should return a bad request error when the required contact information is not provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    await mockJWTUserInfo(appModule, student.user);
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({ mode: "student-edit", identityProvider: IdentityProviders.BCSC })
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST);
  });

  afterAll(async () => {
    await app?.close();
  });
});
