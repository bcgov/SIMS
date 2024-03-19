import { HttpStatus, INestApplication } from "@nestjs/common";
import { Institution, User } from "@sims/sims-db";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
  createFakeEducationProgram,
} from "../../../../testHelpers";
import * as request from "supertest";

describe("EducationProgramInstitutionsController(e2e)-deactivateProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeC: Institution;
  let collegeCUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    collegeC = institution;
    collegeCUser = user;
  });

  it("Should allow an education program to be deactivated when the program belongs to the institution and the program is active.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeC,
      user: collegeCUser,
    });
    await db.educationProgram.save(program);

    const endpoint = `/institutions/education-program/${program.id}/deactivate`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
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
    expect(educationProgram).toEqual({
      id: program.id,
      isActive: false,
      isActiveUpdatedOn: expect.any(Date),
      isActiveUpdatedBy: { id: collegeCUser.id },
      modifier: { id: collegeCUser.id },
    });
  });

  it("Should return a not found HTTP status when a different institution accesses the program.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeC,
      user: collegeCUser,
    });
    await db.educationProgram.save(program);

    const endpoint = `/institutions/education-program/${program.id}/deactivate`;
    // Program created by College C user and tried to be accessed by the College C.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND);
  });

  it("Should return an unprocessable entity HTTP status when the program is already deactivated.", async () => {
    // Arrange
    const program = createFakeEducationProgram(
      {
        institution: collegeC,
        user: collegeCUser,
      },
      { initialValue: { isActive: false } },
    );
    await db.educationProgram.save(program);

    const endpoint = `/institutions/education-program/${program.id}/deactivate`;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "The education program is already set as requested.",
        errorType: "EDUCATION_PROGRAM_INVALID_OPERATION",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
