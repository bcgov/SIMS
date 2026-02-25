import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  Institution,
  InstitutionLocation,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  authorizeUserTokenForLocation,
  getAuthRelatedEntities,
  createFakeEducationProgram,
} from "../../../../testHelpers";
import * as request from "supertest";
import { faker } from "@faker-js/faker";

describe("EducationProgramInstitutionsController(e2e)-getProgramsSummaryByLocationId", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  it("Should retrieve active programs for the location sorted by program name ascending by default.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from pre-existing CollegeF programs in the test database.
    const searchString = faker.string.uuid();
    // Name starting with 'A' to sort before the one starting with 'Z'.
    const firstProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    firstProgram.name = `Alpha ${searchString}`;
    // Name starting with 'Z' to sort after the one starting with 'A'.
    const secondProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    secondProgram.name = `Zeta ${searchString}`;
    // Inactive program that should not be returned by default.
    const inactiveProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { isActive: false } },
    );
    inactiveProgram.name = `Inactive ${searchString}`;
    const [savedFirstProgram, savedSecondProgram] =
      await db.educationProgram.save([
        firstProgram,
        secondProgram,
        inactiveProgram,
      ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedFirstProgram.id,
            programName: savedFirstProgram.name,
            cipCode: savedFirstProgram.cipCode,
            sabcCode: savedFirstProgram.sabcCode,
            credentialType: savedFirstProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedFirstProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedFirstProgram.programStatus,
            isActive: savedFirstProgram.isActive,
            isExpired: savedFirstProgram.isExpired,
            credentialTypeToDisplay: savedFirstProgram.credentialType,
          },
          {
            programId: savedSecondProgram.id,
            programName: savedSecondProgram.name,
            cipCode: savedSecondProgram.cipCode,
            sabcCode: savedSecondProgram.sabcCode,
            credentialType: savedSecondProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedSecondProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedSecondProgram.programStatus,
            isActive: savedSecondProgram.isActive,
            isExpired: savedSecondProgram.isExpired,
            credentialTypeToDisplay: savedSecondProgram.credentialType,
          },
        ],
        count: 2,
      });
  });

  it("Should retrieve only programs whose name matches the search criteria.", async () => {
    // Arrange
    const searchString = faker.string.uuid();
    const matchingProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    matchingProgram.name = `Program ${searchString} match`;
    // Program that should not be returned because the name does not match.
    const nonMatchingProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    const [savedMatchingProgram] = await db.educationProgram.save([
      matchingProgram,
      nonMatchingProgram,
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedMatchingProgram.id,
            programName: savedMatchingProgram.name,
            cipCode: savedMatchingProgram.cipCode,
            sabcCode: savedMatchingProgram.sabcCode,
            credentialType: savedMatchingProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedMatchingProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedMatchingProgram.programStatus,
            isActive: savedMatchingProgram.isActive,
            isExpired: savedMatchingProgram.isExpired,
            credentialTypeToDisplay: savedMatchingProgram.credentialType,
          },
        ],
        count: 1,
      });
  });

  it("Should retrieve only programs whose SABC code matches the search criteria.", async () => {
    // Arrange
    // Using a UUID-based SABC search string to avoid collision with other tests.
    const sabcSearchString = faker.string.alphanumeric(4).toUpperCase();
    const matchingProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { sabcCode: sabcSearchString } },
    );
    // Program that should not be returned because the SABC code does not match.
    const nonMatchingProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    const [savedMatchingProgram] = await db.educationProgram.save([
      matchingProgram,
      nonMatchingProgram,
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${sabcSearchString}&statusSearch=Approved&inactiveProgramSearch=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedMatchingProgram.id,
            programName: savedMatchingProgram.name,
            cipCode: savedMatchingProgram.cipCode,
            sabcCode: savedMatchingProgram.sabcCode,
            credentialType: savedMatchingProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedMatchingProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedMatchingProgram.programStatus,
            isActive: savedMatchingProgram.isActive,
            isExpired: savedMatchingProgram.isExpired,
            credentialTypeToDisplay: savedMatchingProgram.credentialType,
          },
        ],
        count: 1,
      });
  });

  it("Should retrieve only programs whose CIP code matches the search criteria.", async () => {
    // Arrange
    const cipSearchString = faker.string.numeric(2);
    const matchingProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    matchingProgram.cipCode = `${cipSearchString}.0101`;
    // Program with a different CIP code that should not be returned.
    const nonMatchingProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    nonMatchingProgram.cipCode = "cipCode";
    const [savedMatchingProgram] = await db.educationProgram.save([
      matchingProgram,
      nonMatchingProgram,
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${cipSearchString}&statusSearch=Approved&inactiveProgramSearch=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedMatchingProgram.id,
            programName: savedMatchingProgram.name,
            cipCode: savedMatchingProgram.cipCode,
            sabcCode: savedMatchingProgram.sabcCode,
            credentialType: savedMatchingProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedMatchingProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedMatchingProgram.programStatus,
            isActive: savedMatchingProgram.isActive,
            isExpired: savedMatchingProgram.isExpired,
            credentialTypeToDisplay: savedMatchingProgram.credentialType,
          },
        ],
        count: 1,
      });
  });

  it("Should retrieve only programs with the given status when a status filter is applied.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from pre-existing CollegeF programs in the test database.
    const searchString = faker.string.uuid();
    const approvedProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    approvedProgram.name = `Approved ${searchString}`;
    const pendingProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { programStatus: ProgramStatus.Pending } },
    );
    pendingProgram.name = `Pending ${searchString}`;
    const declinedProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { programStatus: ProgramStatus.Declined } },
    );
    declinedProgram.name = `Declined ${searchString}`;
    const [savedApprovedProgram] = await db.educationProgram.save([
      approvedProgram,
      pendingProgram,
      declinedProgram,
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=false`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedApprovedProgram.id,
            programName: savedApprovedProgram.name,
            cipCode: savedApprovedProgram.cipCode,
            sabcCode: savedApprovedProgram.sabcCode,
            credentialType: savedApprovedProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedApprovedProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedApprovedProgram.programStatus,
            isActive: savedApprovedProgram.isActive,
            isExpired: savedApprovedProgram.isExpired,
            credentialTypeToDisplay: savedApprovedProgram.credentialType,
          },
        ],
        count: 1,
      });
  });

  it("Should retrieve inactive programs when the inactive program filter is enabled.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from pre-existing CollegeF programs in the test database.
    const searchString = faker.string.uuid();
    // Name starting with 'A' to sort before the one starting with 'Z'.
    const activeProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    activeProgram.name = `Active ${searchString}`;
    // Name starting with 'Z' to sort after the one starting with 'A'.
    const inactiveProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      {
        initialValue: {
          isActive: false,
          programStatus: ProgramStatus.Approved,
        },
      },
    );
    inactiveProgram.name = `Zeta inactive ${searchString}`;
    const [savedActiveProgram, savedInactiveProgram] =
      await db.educationProgram.save([activeProgram, inactiveProgram]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=true`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedActiveProgram.id,
            programName: savedActiveProgram.name,
            cipCode: savedActiveProgram.cipCode,
            sabcCode: savedActiveProgram.sabcCode,
            credentialType: savedActiveProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedActiveProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedActiveProgram.programStatus,
            isActive: savedActiveProgram.isActive,
            isExpired: savedActiveProgram.isExpired,
            credentialTypeToDisplay: savedActiveProgram.credentialType,
          },
          {
            programId: savedInactiveProgram.id,
            programName: savedInactiveProgram.name,
            cipCode: savedInactiveProgram.cipCode,
            sabcCode: savedInactiveProgram.sabcCode,
            credentialType: savedInactiveProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedInactiveProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedInactiveProgram.programStatus,
            isActive: savedInactiveProgram.isActive,
            isExpired: savedInactiveProgram.isExpired,
            credentialTypeToDisplay: savedInactiveProgram.credentialType,
          },
        ],
        count: 2,
      });
  });

  it("Should retrieve programs sorted by ascending SABC code when sorted by the sabcCode field.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from pre-existing CollegeF programs in the test database.
    const searchString = faker.string.uuid();
    // SABC code starting with 'A' to sort before the one starting with 'Z'.
    const firstProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { sabcCode: "AAA0" } },
    );
    firstProgram.name = `First ${searchString}`;
    // SABC code starting with 'Z' to sort after the one starting with 'A'.
    const secondProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { sabcCode: "ZZZ0" } },
    );
    secondProgram.name = `Second ${searchString}`;
    // Pending program that should be filtered out.
    const pendingProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { programStatus: ProgramStatus.Pending } },
    );
    pendingProgram.name = `Pending ${searchString}`;
    const [savedFirstProgram, savedSecondProgram] =
      await db.educationProgram.save([
        firstProgram,
        secondProgram,
        pendingProgram,
      ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=false&sortField=sabcCode&sortOrder=ASC`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedFirstProgram.id,
            programName: savedFirstProgram.name,
            cipCode: savedFirstProgram.cipCode,
            sabcCode: savedFirstProgram.sabcCode,
            credentialType: savedFirstProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedFirstProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedFirstProgram.programStatus,
            isActive: savedFirstProgram.isActive,
            isExpired: savedFirstProgram.isExpired,
            credentialTypeToDisplay: savedFirstProgram.credentialType,
          },
          {
            programId: savedSecondProgram.id,
            programName: savedSecondProgram.name,
            cipCode: savedSecondProgram.cipCode,
            sabcCode: savedSecondProgram.sabcCode,
            credentialType: savedSecondProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedSecondProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedSecondProgram.programStatus,
            isActive: savedSecondProgram.isActive,
            isExpired: savedSecondProgram.isExpired,
            credentialTypeToDisplay: savedSecondProgram.credentialType,
          },
        ],
        count: 2,
      });
  });

  it("Should retrieve programs sorted by ascending CIP code when sorted by the cipCode field.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from pre-existing CollegeF programs in the test database.
    const searchString = faker.string.uuid();
    const firstProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    // CIP code starting with '01' to sort before '99'.
    firstProgram.cipCode = "01.0101";
    firstProgram.name = `First ${searchString}`;
    const secondProgram = createFakeEducationProgram({
      institution: collegeF,
      user: sharedUser,
    });
    // CIP code starting with '99' to sort after '01'.
    secondProgram.cipCode = "99.9999";
    secondProgram.name = `Second ${searchString}`;
    // Inactive program that should be filtered out.
    const inactiveProgram = createFakeEducationProgram(
      { institution: collegeF, user: sharedUser },
      { initialValue: { isActive: false } },
    );
    inactiveProgram.name = `Inactive ${searchString}`;
    const [savedFirstProgram, savedSecondProgram] =
      await db.educationProgram.save([
        firstProgram,
        secondProgram,
        inactiveProgram,
      ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/education-program/location/${collegeFLocation.id}/summary?page=0&pageLimit=10&searchCriteria=${searchString}&statusSearch=Approved&inactiveProgramSearch=false&sortField=cipCode&sortOrder=ASC`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            programId: savedFirstProgram.id,
            programName: savedFirstProgram.name,
            cipCode: savedFirstProgram.cipCode,
            sabcCode: savedFirstProgram.sabcCode,
            credentialType: savedFirstProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedFirstProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedFirstProgram.programStatus,
            isActive: savedFirstProgram.isActive,
            isExpired: savedFirstProgram.isExpired,
            credentialTypeToDisplay: savedFirstProgram.credentialType,
          },
          {
            programId: savedSecondProgram.id,
            programName: savedSecondProgram.name,
            cipCode: savedSecondProgram.cipCode,
            sabcCode: savedSecondProgram.sabcCode,
            credentialType: savedSecondProgram.credentialType,
            totalOfferings: "0",
            submittedDate: savedSecondProgram.createdAt.toISOString(),
            locationId: collegeFLocation.id,
            locationName: collegeFLocation.name,
            programStatus: savedSecondProgram.programStatus,
            isActive: savedSecondProgram.isActive,
            isExpired: savedSecondProgram.isExpired,
            credentialTypeToDisplay: savedSecondProgram.credentialType,
          },
        ],
        count: 2,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
