import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  createFakeUser,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  createFakeEducationProgram,
  getAESTToken,
  getAESTUser,
  AESTGroups,
} from "../../../../testHelpers";
import * as request from "supertest";
import { Institution, User } from "@sims/sims-db";

describe("EducationProgramAESTController(e2e)-deactivateProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedInstitution: Institution;
  let sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedInstitution = createFakeInstitution();
    await db.institution.save(sharedInstitution);
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  it("Should allow an education program to be deactivated when the program is active.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: sharedInstitution,
      user: sharedUser,
    });
    await db.educationProgram.save(program);

    const endpoint = `/aest/education-program/${program.id}/deactivate`;
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);
    const aestUser = await getAESTUser(
      db.dataSource,
      AESTGroups.BusinessAdministrators,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        note: "Some notes.",
      })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const educationProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        isActive: true,
        isActiveUpdatedOn: true,
        isActiveUpdatedBy: {
          id: true,
        },
        modifier: { id: true },
      },
      relations: {
        isActiveUpdatedBy: true,
        modifier: true,
      },
      where: { id: program.id },
    });
    const expectedUser = { id: aestUser.id };
    expect(educationProgram).toEqual({
      id: program.id,
      isActive: false,
      isActiveUpdatedOn: expect.any(Date),
      isActiveUpdatedBy: expectedUser,
      modifier: expectedUser,
    });
  });

  it("Should return an unprocessable entity HTTP status when the program is already deactivated.", async () => {
    // Arrange
    const program = createFakeEducationProgram(
      {
        institution: sharedInstitution,
        user: sharedUser,
      },
      {
        initialValue: { isActive: false },
      },
    );
    await db.educationProgram.save(program);

    const endpoint = `/aest/education-program/${program.id}/deactivate`;
    const userToken = await getAESTToken(AESTGroups.OperationsAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        note: "Some notes.",
      })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The education program is already set as requested.",
        errorType: "EDUCATION_PROGRAM_INVALID_OPERATION",
      });
  });

  it("Should return a not found HTTP status when the program id does not exists.", async () => {
    // Arrange
    const endpoint = `/aest/education-program/99999/deactivate`;
    const userToken = await getAESTToken(AESTGroups.OperationsAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send({
        note: "Some notes.",
      })
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the education program.",
        error: "Not Found",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
