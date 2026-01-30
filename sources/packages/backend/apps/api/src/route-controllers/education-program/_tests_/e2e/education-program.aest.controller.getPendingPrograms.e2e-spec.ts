import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createFakeLocation,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
  createFakeInstitution,
  createFakeUser,
} from "@sims/test-utils";
import { ProgramStatus, User } from "@sims/sims-db";
import * as request from "supertest";
import { addDays } from "@sims/utilities";

const PAST_SUBMITTED_DATE = new Date("2000-01-01");

describe("EducationProgramAESTController(e2e)-getPendingPrograms", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let savedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    savedUser = await db.user.save(createFakeUser());
  });

  it(
    "Should return two pending programs for active Programs with search criteria (Mathematics) " +
      "and the default sort (submittedDate ASC) applied.",
    async () => {
      // Arrange

      // Custom dates are used to avoid collisions with other test data.
      const institution = createFakeInstitution();
      await db.institution.save(institution);

      const location = createFakeLocation(institution);
      await db.institutionLocation.save(location);

      const oldProgram = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Mathematics 101",
            programStatus: ProgramStatus.Pending,
            submittedDate: PAST_SUBMITTED_DATE,
          },
        },
      );

      const olderProgram = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Mathematics 201",
            programStatus: ProgramStatus.Pending,
            submittedDate: addDays(-1, PAST_SUBMITTED_DATE),
          },
        },
      );

      const oldestProgram = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Mathematics 301",
            programStatus: ProgramStatus.Pending,
            submittedDate: addDays(-2, PAST_SUBMITTED_DATE),
          },
        },
      );

      // Create the newer program before the older program to ensure that our default
      // sort works and that we're not just getting default DB ordering.
      await db.educationProgram.save([oldProgram, oldestProgram, olderProgram]);

      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      // Include a search criteria that matches both programs to avoid test data collisions.
      const searchCriteria = "Mathematics";
      const endpoint = `/aest/education-program/pending?page=0&pageLimit=2&searchCriteria=${searchCriteria}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: oldestProgram.id,
              programName: oldestProgram.name,
              institutionOperatingName: institution.operatingName,
              submittedDate: oldestProgram.submittedDate.toISOString(),
              institutionId: institution.id,
              locationId: location.id,
            },
            {
              id: olderProgram.id,
              programName: olderProgram.name,
              institutionOperatingName: institution.operatingName,
              submittedDate: olderProgram.submittedDate.toISOString(),
              institutionId: institution.id,
              locationId: location.id,
            },
          ],
          count: 3,
        });
    },
  );

  it(
    "Should return three pending programs for an active Program with search criteria (Chemistry) " +
      "and a custom sort (programName ASC) applied.",
    async () => {
      // Arrange

      // Custom dates are used to avoid collisions with other test data.
      const institution = createFakeInstitution();
      await db.institution.save(institution);

      const location = createFakeLocation(institution);
      await db.institutionLocation.save(location);

      const programA = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Chemistry 101",
            programStatus: ProgramStatus.Pending,
            submittedDate: PAST_SUBMITTED_DATE,
          },
        },
      );

      const programB = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Chemistry 201",
            programStatus: ProgramStatus.Pending,
            submittedDate: PAST_SUBMITTED_DATE,
          },
        },
      );

      const programC = createFakeEducationProgram(
        {
          auditUser: savedUser,
          institution,
        },
        {
          initialValues: {
            name: "Chemistry 301",
            programStatus: ProgramStatus.Pending,
            submittedDate: PAST_SUBMITTED_DATE,
          },
        },
      );

      await db.educationProgram.save([programC, programA, programB]);

      // Ministry token.
      const token = await getAESTToken(AESTGroups.BusinessAdministrators);
      const searchCriteria = "Chemistry";
      const endpoint = `/aest/education-program/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}&sortField=programName&sortOrder=ASC`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              id: programA.id,
              programName: programA.name,
              institutionOperatingName: institution.operatingName,
              submittedDate: programA.submittedDate.toISOString(),
              institutionId: institution.id,
              locationId: location.id,
            },
            {
              id: programB.id,
              programName: programB.name,
              institutionOperatingName: institution.operatingName,
              submittedDate: programB.submittedDate.toISOString(),
              institutionId: institution.id,
              locationId: location.id,
            },
            {
              id: programC.id,
              programName: programC.name,
              institutionOperatingName: institution.operatingName,
              submittedDate: programC.submittedDate.toISOString(),
              institutionId: institution.id,
              locationId: location.id,
            },
          ],
          count: 3,
        });
    },
  );

  it("Should not return inactive pending programs.", async () => {
    // Arrange
    const institution = createFakeInstitution();
    await db.institution.save(institution);

    const location = createFakeLocation(institution);
    await db.institutionLocation.save(location);

    const activeProgram = createFakeEducationProgram(
      {
        auditUser: savedUser,
        institution,
      },
      {
        initialValues: {
          name: "Physics Active Pending",
          programStatus: ProgramStatus.Pending,
          isActive: true,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const inactiveProgram = createFakeEducationProgram(
      {
        auditUser: savedUser,
        institution,
      },
      {
        initialValues: {
          name: "Physics Inactive Pending",
          programStatus: ProgramStatus.Pending,
          isActive: false,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    await db.educationProgram.save([activeProgram, inactiveProgram]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const searchCriteria = "Physics";
    const endpoint = `/aest/education-program/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: activeProgram.id,
            programName: activeProgram.name,
            institutionOperatingName: institution.operatingName,
            submittedDate: activeProgram.submittedDate.toISOString(),
            institutionId: institution.id,
            locationId: location.id,
          },
        ],
        count: 1,
      });
  });

  it("Should search by institution operating name.", async () => {
    // Arrange
    const uniqueInstitutionName = "Unique Test Institution XYZ";
    const institution = createFakeInstitution();
    institution.operatingName = uniqueInstitutionName;
    await db.institution.save(institution);

    const program = createFakeEducationProgram(
      {
        auditUser: savedUser,
        institution,
      },
      {
        initialValues: {
          name: "Generic Program Name",
          programStatus: ProgramStatus.Pending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    await db.educationProgram.save(program);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const searchCriteria = "Unique Test Institution";
    const endpoint = `/aest/education-program/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: program.id,
            programName: program.name,
            institutionOperatingName: institution.operatingName,
            submittedDate: program.submittedDate.toISOString(),
            institutionId: institution.id,
            locationId: null,
          },
        ],
        count: 1,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
