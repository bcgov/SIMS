import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeStudent,
} from "@sims/test-utils";
import { IdentityProviders } from "@sims/sims-db";

describe("StudentAESTController(e2e)-getUploadedFile", () => {
  let app: INestApplication;
  let db: E2EDataSources;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
  });

  it("Should allow the student profile update when the student is a Basic BCeID user.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.student.save(student);
    const studentProfileUpdateInfo = {
      givenNames: "SCOOBY",
      lastName: "DOOBY-DOO",
      birthdate: "1980-03-24",
      email: "dummy@some.domain",
      noteDescription: "Some dummy note.",
    };
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    let endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Arrange
    endpoint = `/aest/student/${student.id}`;
    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
    expect(response.body).toEqual(
      expect.objectContaining({
        firstName: "SCOOBY",
        lastName: "DOOBY-DOO",
        dateOfBirth: "1980-03-24",
        email: "dummy@some.domain",
      }),
    );
  });

  it("Should throw a HTTP Unprocessable Entity (422) error when the student is not a Basic BCeID user.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBusiness;
    await db.student.save(student);
    const studentProfileUpdateInfo = {
      givenNames: "SCOOBY",
      lastName: "DOOBY-DOO",
      birthdate: "1980-03-24",
      email: "dummy@some.domain",
      noteDescription: "Some dummy note.",
    };
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toStrictEqual({
      error: "Unprocessable Entity",
      message: "Not possible to update a non-basic-BCeID student.",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it("Should throw a HTTP Forbidden (403) error when the ministry user performing the profile update does not have the associated role.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.MOFOperations);
    const endpoint = "/aest/student/9999";

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({})
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN);
  });

  it("Should throw a HTTP Unprocessable Entity (422) error when the student is a Basic BCeID user but none of the user profile information that needs to be updated has changed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.student.save(student);
    const studentProfileUpdateInfo = {
      givenNames: student.user.firstName?.toUpperCase(),
      lastName: student.user.lastName.toUpperCase(),
      birthdate: student.birthDate,
      email: student.user.email.toUpperCase(),
      noteDescription: "Some other dummy note.",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(response.body).toStrictEqual({
      error: "Unprocessable Entity",
      message: "No profile data updated because no changes were detected.",
      statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
  });

  it("Should throw a HTTP Not Found (404) error when the student does not exist.", async () => {
    // Arrange
    const studentProfileUpdateInfo = {
      givenNames: "SCOOBY",
      lastName: "DOOBY-DOO",
      birthdate: "1980-03-24",
      email: "dummy@some.domain",
      noteDescription: "Some dummy note.",
    };
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/student/9999";

    // Act/Assert
    const response = await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
    expect(response.body).toStrictEqual({
      error: "Not Found",
      message: "Student does not exist.",
      statusCode: HttpStatus.NOT_FOUND,
    });
  });

  it("Should throw a HTTP Bad Request error when some mandatory profile update information is missing from the payload.", async () => {
    // Arrange
    const studentProfileUpdateInfo = {
      givenNames: "SCOOBY",
      birthdate: "1980-03-24",
      email: "dummy@some.domain",
      noteDescription: "Some dummy note.",
    };
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = "/aest/student/9999";

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST);
  });

  afterAll(async () => {
    await app?.close();
  });
});
