import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitution,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createFakeEducationProgram,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  Institution,
  InstitutionLocation,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import * as request from "supertest";
import * as faker from "faker";

describe("EducationProgramAESTController(e2e)-getProgramsSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let institution: Institution;
  let institutionLocation: InstitutionLocation;
  let sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  beforeEach(async () => {
    institution = createFakeInstitution();
    institutionLocation = createFakeInstitutionLocation({
      institution: institution,
    });
    await db.institutionLocation.save(institutionLocation);
  });

  it(
    "Should not retrieve any education programs when the search for the programs is made and no program statuses are searched for " +
      "including no search for the inactive programs.",
    async () => {
      // Arrange
      const approvedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const inactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Pending,
          },
        },
      );
      await db.educationProgram.save([approvedProgram, inactiveProgram]);

      const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=&locationNameSearch=&inactiveProgramSearch=false`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({ results: [], count: 0 });
    },
  );

  it(
    "Should retrieve all the education programs when the search for the programs is made and all program statuses are searched for " +
      "including the inactive programs.",
    async () => {
      // Arrange
      const approvedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const inactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Pending,
          },
        },
      );
      const [savedApprovedProgram, savedInactiveProgram] =
        await db.educationProgram.save([approvedProgram, inactiveProgram]);

      const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=&locationNameSearch=&inactiveProgramSearch=true&statusSearch=Approved,Pending,Declined`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              programId: savedApprovedProgram.id,
              programName: savedApprovedProgram.name,
              cipCode: savedApprovedProgram.cipCode,
              credentialType: savedApprovedProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedApprovedProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedApprovedProgram.programStatus,
              isActive: savedApprovedProgram.isActive,
              isExpired: savedApprovedProgram.isExpired,
              credentialTypeToDisplay: savedApprovedProgram.credentialType,
            },
            {
              programId: savedInactiveProgram.id,
              programName: savedInactiveProgram.name,
              cipCode: savedInactiveProgram.cipCode,
              credentialType: savedInactiveProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedInactiveProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedInactiveProgram.programStatus,
              isActive: savedInactiveProgram.isActive,
              isExpired: savedInactiveProgram.isExpired,
              credentialTypeToDisplay: savedInactiveProgram.credentialType,
            },
          ],
          count: 2,
        });
    },
  );

  it(
    "Should retrieve all the inactive education programs when the search for the programs is made and none of the program statuses are selected " +
      "except for the inactive programs.",
    async () => {
      // Arrange
      const approvedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const pendingProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        { initialValue: { programStatus: ProgramStatus.Pending } },
      );
      const declinedProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            programStatus: ProgramStatus.Declined,
          },
        },
      );
      const inactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Pending,
          },
        },
      );
      const [savedInactiveProgram] = await db.educationProgram.save([
        inactiveProgram,
        approvedProgram,
        pendingProgram,
        declinedProgram,
      ]);

      const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=&locationNameSearch=&inactiveProgramSearch=true`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              programId: savedInactiveProgram.id,
              programName: savedInactiveProgram.name,
              cipCode: savedInactiveProgram.cipCode,
              credentialType: savedInactiveProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedInactiveProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedInactiveProgram.programStatus,
              isActive: savedInactiveProgram.isActive,
              isExpired: savedInactiveProgram.isExpired,
              credentialTypeToDisplay: savedInactiveProgram.credentialType,
            },
          ],
          count: 1,
        });
    },
  );

  it(
    "Should retrieve all the pending, declined and inactive education programs sorted by ascending program status when the search for the programs is made " +
      "and pending, declined program statuses are selected along with the inactive programs.",
    async () => {
      // Arrange
      const approvedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const pendingProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        { initialValue: { programStatus: ProgramStatus.Pending } },
      );
      const declinedProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            programStatus: ProgramStatus.Declined,
          },
        },
      );
      const inactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Pending,
          },
        },
      );
      const [savedPendingProgram, savedDeclinedProgram, savedInactiveProgram] =
        await db.educationProgram.save([
          pendingProgram,
          declinedProgram,
          inactiveProgram,
          approvedProgram,
        ]);

      const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=&locationNameSearch=&inactiveProgramSearch=true&statusSearch=Pending,Declined&sortField=programStatus&sortOrder=DESC`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              programId: savedPendingProgram.id,
              programName: savedPendingProgram.name,
              cipCode: savedPendingProgram.cipCode,
              credentialType: savedPendingProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedPendingProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedPendingProgram.programStatus,
              isActive: savedPendingProgram.isActive,
              isExpired: savedPendingProgram.isExpired,
              credentialTypeToDisplay: savedPendingProgram.credentialType,
            },
            {
              programId: savedInactiveProgram.id,
              programName: savedInactiveProgram.name,
              cipCode: savedInactiveProgram.cipCode,
              credentialType: savedInactiveProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedInactiveProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedInactiveProgram.programStatus,
              isActive: savedInactiveProgram.isActive,
              isExpired: savedInactiveProgram.isExpired,
              credentialTypeToDisplay: savedInactiveProgram.credentialType,
            },
            {
              programId: savedDeclinedProgram.id,
              programName: savedDeclinedProgram.name,
              cipCode: savedDeclinedProgram.cipCode,
              credentialType: savedDeclinedProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedDeclinedProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedDeclinedProgram.programStatus,
              isActive: savedDeclinedProgram.isActive,
              isExpired: savedDeclinedProgram.isExpired,
              credentialTypeToDisplay: savedDeclinedProgram.credentialType,
            },
          ],
          count: 3,
        });
    },
  );

  it("Should retrieve all the approved and declined education programs when the search for the programs is made and only the approved and declined program statuses are selected.", async () => {
    // Arrange
    const approvedProgram = createFakeEducationProgram({
      institution: institution,
      user: sharedUser,
    });
    const pendingProgram = createFakeEducationProgram(
      {
        institution: institution,
        user: sharedUser,
      },
      { initialValue: { programStatus: ProgramStatus.Pending } },
    );
    const declinedProgram = createFakeEducationProgram(
      {
        institution: institution,
        user: sharedUser,
      },
      {
        initialValue: {
          programStatus: ProgramStatus.Declined,
        },
      },
    );
    const inactiveProgram = createFakeEducationProgram(
      {
        institution: institution,
        user: sharedUser,
      },
      {
        initialValue: {
          isActive: false,
          programStatus: ProgramStatus.Declined,
        },
      },
    );
    const [savedApprovedProgram, savedDeclinedProgram] =
      await db.educationProgram.save([
        approvedProgram,
        declinedProgram,
        pendingProgram,
        inactiveProgram,
      ]);

    const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=&locationNameSearch=&inactiveProgramSearch=false&statusSearch=Approved,Declined`;
    const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(userToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedApprovedProgram.id,
            programName: savedApprovedProgram.name,
            cipCode: savedApprovedProgram.cipCode,
            credentialType: savedApprovedProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedApprovedProgram.createdAt.toISOString(),
            locationId: institutionLocation.id,
            locationName: institutionLocation.name,
            programStatus: savedApprovedProgram.programStatus,
            isActive: savedApprovedProgram.isActive,
            isExpired: savedApprovedProgram.isExpired,
            credentialTypeToDisplay: savedApprovedProgram.credentialType,
          },
          {
            programId: savedDeclinedProgram.id,
            programName: savedDeclinedProgram.name,
            cipCode: savedDeclinedProgram.cipCode,
            credentialType: savedDeclinedProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedDeclinedProgram.createdAt.toISOString(),
            locationId: institutionLocation.id,
            locationName: institutionLocation.name,
            programStatus: savedDeclinedProgram.programStatus,
            isActive: savedDeclinedProgram.isActive,
            isExpired: savedDeclinedProgram.isExpired,
            credentialTypeToDisplay: savedDeclinedProgram.credentialType,
          },
        ],
        count: 2,
      });
  });

  it(
    "Should retrieve all the approved and pending education programs matching the program name search string when the search " +
      "for the programs is made and the approved and pending program statuses are selected along with the program name search filter.",
    async () => {
      // Arrange
      const firstApprovedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const programSearchString = faker.datatype.uuid();
      firstApprovedProgram.name = programSearchString;
      const secondApprovedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      secondApprovedProgram.name = "My second approved program";
      const firstPendingProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        { initialValue: { programStatus: ProgramStatus.Pending } },
      );
      firstPendingProgram.name = "My first pending program";
      const secondPendingProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        { initialValue: { programStatus: ProgramStatus.Pending } },
      );
      secondPendingProgram.name =
        `My second pending program ${programSearchString} dummy`.toUpperCase();
      const declinedProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            programStatus: ProgramStatus.Declined,
          },
        },
      );
      const inactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Approved,
          },
        },
      );
      const [savedFirstApprovedProgram, savedSecondPendingProgram] =
        await db.educationProgram.save([
          firstApprovedProgram,
          secondPendingProgram,
          secondApprovedProgram,
          firstPendingProgram,
          declinedProgram,
          inactiveProgram,
        ]);

      const endpoint = `/aest/education-program/institution/${institution.id}/summary?page=0&pageLimit=10&programNameSearch=${programSearchString}&locationNameSearch=&inactiveProgramSearch=false&statusSearch=Approved,Pending`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              programId: savedSecondPendingProgram.id,
              programName: savedSecondPendingProgram.name,
              cipCode: savedSecondPendingProgram.cipCode,
              credentialType: savedSecondPendingProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedSecondPendingProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedSecondPendingProgram.programStatus,
              isActive: savedSecondPendingProgram.isActive,
              isExpired: savedSecondPendingProgram.isExpired,
              credentialTypeToDisplay: savedSecondPendingProgram.credentialType,
            },
            {
              programId: savedFirstApprovedProgram.id,
              programName: savedFirstApprovedProgram.name,
              cipCode: savedFirstApprovedProgram.cipCode,
              credentialType: savedFirstApprovedProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedFirstApprovedProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: savedFirstApprovedProgram.programStatus,
              isActive: savedFirstApprovedProgram.isActive,
              isExpired: savedFirstApprovedProgram.isExpired,
              credentialTypeToDisplay: savedFirstApprovedProgram.credentialType,
            },
          ],
          count: 2,
        });
    },
  );

  it(
    "Should retrieve all the declined and inactive education programs sorted by ascending program status matching the program name search string and the location name search string " +
      "when the search for the programs is made and the declined program status is selected along with the inactive programs selected and the program name and location name search filter.",
    async () => {
      // Arrange
      const locationSearchString = faker.datatype.uuid();
      institutionLocation.name = locationSearchString;
      const secondInstitutionLocation = createFakeInstitutionLocation({
        institution: institution,
      });
      secondInstitutionLocation.name = "Second Institution Name";
      await db.institutionLocation.save([
        institutionLocation,
        secondInstitutionLocation,
      ]);
      const declinedProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            programStatus: ProgramStatus.Declined,
          },
        },
      );
      const programSearchString = faker.datatype.uuid();
      declinedProgram.name = programSearchString;
      const pendingProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        { initialValue: { programStatus: ProgramStatus.Pending } },
      );
      // To show the "and" operation between the different conditions,
      // adding the programSearchString to the name of this program.
      // Even on adding this programSearchString to the name of the pendingProgram,
      // it will still not be retrieved since only the declined and inactive programs
      // will be retrieved.
      pendingProgram.name = `My pending program ${programSearchString} dummy`;
      const approvedProgram = createFakeEducationProgram({
        institution: institution,
        user: sharedUser,
      });
      const firstInactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Approved,
          },
        },
      );
      firstInactiveProgram.name = `My inactive program ${programSearchString} dummy`;
      const secondInactiveProgram = createFakeEducationProgram(
        {
          institution: institution,
          user: sharedUser,
        },
        {
          initialValue: {
            isActive: false,
            programStatus: ProgramStatus.Pending,
          },
        },
      );
      secondInactiveProgram.name = "My second inactive program";
      const [savedDeclinedProgram, savedFirstInactiveProgram] =
        await db.educationProgram.save([
          declinedProgram,
          firstInactiveProgram,
          pendingProgram,
          approvedProgram,
          secondInactiveProgram,
        ]);

      const endpoint = `/aest/education-program/institution/${
        institution.id
      }/summary?page=0&pageLimit=10&programNameSearch=${programSearchString.toUpperCase()}&locationNameSearch=${locationSearchString.toUpperCase()}&inactiveProgramSearch=true&statusSearch=Declined&sortField=programStatus&sortOrder=ASC`;
      const userToken = await getAESTToken(AESTGroups.BusinessAdministrators);

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(userToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          results: [
            {
              programId: savedDeclinedProgram.id,
              programName: savedDeclinedProgram.name,
              cipCode: savedDeclinedProgram.cipCode,
              credentialType: savedDeclinedProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedDeclinedProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: ProgramStatus.Declined,
              isActive: savedDeclinedProgram.isActive,
              isExpired: savedDeclinedProgram.isExpired,
              credentialTypeToDisplay: savedDeclinedProgram.credentialType,
            },
            {
              programId: savedFirstInactiveProgram.id,
              programName: savedFirstInactiveProgram.name,
              cipCode: savedFirstInactiveProgram.cipCode,
              credentialType: savedFirstInactiveProgram.credentialType,
              totalOfferings: "0",
              submittedDate: savedFirstInactiveProgram.createdAt.toISOString(),
              locationId: institutionLocation.id,
              locationName: institutionLocation.name,
              programStatus: ProgramStatus.Approved,
              isActive: savedFirstInactiveProgram.isActive,
              isExpired: savedFirstInactiveProgram.isExpired,
              credentialTypeToDisplay: savedFirstInactiveProgram.credentialType,
            },
          ],
          count: 2,
        });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
