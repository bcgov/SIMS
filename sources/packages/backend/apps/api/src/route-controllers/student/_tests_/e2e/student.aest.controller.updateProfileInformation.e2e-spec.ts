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
import * as faker from "faker";

interface StudentProfileUpdateInfo {
  givenNames: string;
  lastName: string;
  birthdate: string;
  email: string;
  noteDescription: string;
}

describe("StudentAESTController(e2e)-updateProfileInformation", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let studentProfileUpdateInfo: StudentProfileUpdateInfo;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    studentProfileUpdateInfo = {
      givenNames: faker.name.firstName(),
      lastName: faker.name.lastName(),
      birthdate: "1990-01-15",
      email: faker.internet.email(),
      noteDescription: faker.datatype.uuid(),
    };
  });

  it("Should allow the student profile update when the student is a Basic BCeID user.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.user.save(student.user);
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          identityProviderType: true,
          isActive: true,
          updatedAt: true,
          userName: true,
        },
        sinValidation: { id: true },
      },
      relations: { user: true, sinValidation: true },
      where: {
        id: student.id,
        notes: { description: studentProfileUpdateInfo.noteDescription },
      },
    });
    expect(updatedStudent).toEqual({
      id: updatedStudent.id,
      birthDate: studentProfileUpdateInfo.birthdate,
      sinValidation: { id: updatedStudent.sinValidation.id },
      user: {
        // Validating all the properties since eager is set to true for the User in the Student model resulting in all properties being fetched.
        email: studentProfileUpdateInfo.email,
        firstName: studentProfileUpdateInfo.givenNames,
        lastName: studentProfileUpdateInfo.lastName,
        id: updatedStudent.user.id,
        createdAt: updatedStudent.user.createdAt,
        identityProviderType: updatedStudent.user.identityProviderType,
        isActive: updatedStudent.user.isActive,
        updatedAt: updatedStudent.user.updatedAt,
        userName: updatedStudent.user.userName,
      },
    });
    expect(updatedStudent.sinValidation.id).not.toBe(student.sinValidation.id);
  });

  it("Should throw an HTTP Unprocessable Entity (422) error when the student is not a Basic BCeID user.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBusiness;
    await db.user.save(student.user);
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        error: "Unprocessable Entity",
        message: "Not possible to update a non-basic-BCeID student.",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an HTTP Forbidden (403) error when the ministry user performing the profile update does not have the associated role.", async () => {
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

  it("Should throw an HTTP Unprocessable Entity (422) error when the student is a Basic BCeID user but none of the user profile information that needs to be updated has changed.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.user.save(student.user);
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
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        error: "Unprocessable Entity",
        message: "No profile data updated because no changes were detected.",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  it("Should throw an HTTP Not Found (404) error when the student does not exist.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = "/aest/student/9999";

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(studentProfileUpdateInfo)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        error: "Not Found",
        message: "Student does not exist.",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  it("Should throw an HTTP Bad Request error when some mandatory profile update information is missing from the payload.", async () => {
    // Arrange
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = "/aest/student/9999";

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        givenNames: faker.name.firstName(),
        birthdate: "1990-01-15",
        email: faker.internet.email(),
        noteDescription: faker.lorem.text(),
      })
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST);
  });

  it("Should allow the student profile update when the student is a Basic BCeID user and the givenNames is not provided.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    student.user.identityProviderType = IdentityProviders.BCeIDBasic;
    await db.user.save(student.user);
    const updatedStudentProfile = {
      lastName: faker.name.lastName(),
      birthdate: "1990-01-16",
      email: faker.internet.email(),
      noteDescription: faker.datatype.uuid(),
    };
    const token = await getAESTToken(AESTGroups.OperationsAdministrators);
    const endpoint = `/aest/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(updatedStudentProfile)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedStudent = await db.student.findOne({
      select: {
        id: true,
        birthDate: true,
        user: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          createdAt: true,
          identityProviderType: true,
          isActive: true,
          updatedAt: true,
          userName: true,
        },
        sinValidation: { id: true },
      },
      relations: { user: true, sinValidation: true },
      where: {
        id: student.id,
        notes: { description: updatedStudentProfile.noteDescription },
      },
    });
    expect(updatedStudent).toEqual({
      id: updatedStudent.id,
      birthDate: updatedStudentProfile.birthdate,
      sinValidation: { id: updatedStudent.sinValidation.id },
      user: {
        // Validating all the properties since eager is set to true for the User in the Student model resulting in all properties being fetched.
        email: updatedStudentProfile.email,
        firstName: null,
        lastName: updatedStudentProfile.lastName,
        id: updatedStudent.user.id,
        createdAt: updatedStudent.user.createdAt,
        identityProviderType: updatedStudent.user.identityProviderType,
        isActive: updatedStudent.user.isActive,
        updatedAt: updatedStudent.user.updatedAt,
        userName: updatedStudent.user.userName,
      },
    });
    expect(updatedStudent.sinValidation.id).not.toBe(student.sinValidation.id);
  });

  afterAll(async () => {
    await app?.close();
  });
});
