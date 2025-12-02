import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  createFakeUser,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createFakeEducationProgram,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import { ProgramStatus, User } from "@sims/sims-db";
import * as request from "supertest";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("EducationProgramAESTController(e2e)-getProgramsListForInstitutions", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  it("Should retrieve all active, non-expired, and approved programs, ordered by name when there are active, approved and non-expired programs for the institution.", async () => {
    // Arrange
    const institution = await db.institution.save(createFakeInstitution());
    const educationPrograms = [
      // Approved, active and non-expired program.
      {
        isActive: true,
        programStatus: ProgramStatus.Approved,
        name: "Z Program",
      },
      // Approved, active and non-expired program.
      {
        isActive: true,
        programStatus: ProgramStatus.Approved,
        name: "A Program",
      },
      // Inactive program.
      {
        isActive: false,
      },
      // Pending program.
      {
        programStatus: ProgramStatus.Pending,
      },
      // Expired program.
      {
        effectiveEndDate: getISODateOnlyString(addDays(-1)),
      },
    ].map((initialValue) =>
      createFakeEducationProgram(
        {
          institution,
          user: sharedUser,
        },
        { initialValue },
      ),
    );
    await db.educationProgram.save(educationPrograms);
    const [approvedZProgram, approvedAProgram] = educationPrograms;
    const endpoint = `/aest/education-program/institution/${institution.id}/programs-list`;
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        { id: approvedAProgram.id, description: approvedAProgram.name },
        { id: approvedZProgram.id, description: approvedZProgram.name },
      ]);
  });

  it("Should throw a not found exception when the institution does not exist.", async () => {
    // Arrange
    const endpoint = `/aest/education-program/institution/999999/programs-list`;
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message: "Institution ID 999999 not found.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
