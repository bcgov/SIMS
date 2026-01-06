import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
  createFakeEducationProgramOffering,
  createFakeUser,
} from "@sims/test-utils";
import {
  EducationProgramOffering,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  User,
} from "@sims/sims-db";
import * as request from "supertest";
import { addDays, getISODateOnlyString } from "@sims/utilities";

const PAST_SUBMITTED_DATE = new Date("2000-01-01");

describe("EducationProgramOfferingAESTController(e2e)-getPendingOfferings", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let savedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    savedUser = await db.user.save(createFakeUser());
  });

  it("Should return two pending offerings for an active Program with the default sort (submittedDate ASC) applied.", async () => {
    // Arrange

    // Custom dates are used to avoid collisions with other test data.
    const oldOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const olderOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-1, PAST_SUBMITTED_DATE),
        },
      },
    );

    const oldestOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-2, PAST_SUBMITTED_DATE),
        },
      },
    );

    // Create the newer offering before the older offering to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    await db.educationProgramOffering.save([
      oldOffering,
      oldestOffering,
      olderOffering,
    ]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=2`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          buildExpectedOffering(oldestOffering),
          buildExpectedOffering(olderOffering),
        ],
        count: 3,
      });
  });

  it("Should return two pending offerings for an active Program with a custom sort (submittedDate DESC) applied.", async () => {
    // Arrange

    // Custom dates are used to avoid collisions with other test data.
    const newerOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Math 101",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const olderOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Math 201",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-1, PAST_SUBMITTED_DATE),
        },
      },
    );

    // Create the older offering before the newer offering to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    await db.educationProgramOffering.save([olderOffering, newerOffering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const sortField = "submittedDate";
    const sortOrder = "DESC";
    // Include a search criteria that matches both offerings to avoid test data collisions.
    const searchCriteria = "Math";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=2&sortField=${sortField}&sortOrder=${sortOrder}&searchCriteria=${searchCriteria}`;
    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          buildExpectedOffering(newerOffering),
          buildExpectedOffering(olderOffering),
        ],
        count: 2,
      });
  });

  it("Should return three pending offerings for an active Program with a custom sort (offeringType ASC) applied.", async () => {
    // Arrange

    // Custom dates are used to avoid collisions with other test data.
    const publicOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Chemistry 101",
          offeringStatus: OfferingStatus.CreationPending,
          offeringType: OfferingTypes.Public,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const privateOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Chemistry 201",
          offeringStatus: OfferingStatus.CreationPending,
          offeringType: OfferingTypes.Private,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const scholasticStandingOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Chemistry 301",
          offeringStatus: OfferingStatus.CreationPending,
          offeringType: OfferingTypes.ScholasticStanding,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    // Create the offerings in non alphabetical order for offeringType to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    await db.educationProgramOffering.save([
      publicOffering,
      privateOffering,
      scholasticStandingOffering,
    ]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const sortField = "offeringType";
    const sortOrder = "ASC";
    // Include a search criteria that matches both offerings to avoid test data collisions.
    const searchCriteria = "Chemistry";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=3&sortField=${sortField}&sortOrder=${sortOrder}&searchCriteria=${searchCriteria}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          buildExpectedOffering(privateOffering),
          buildExpectedOffering(publicOffering),
          buildExpectedOffering(scholasticStandingOffering),
        ],
        count: 3,
      });
  });

  it("Should return two pending offerings for an active Program with a custom sort (offeringIntensity ASC) applied.", async () => {
    // Arrange

    // Custom dates are used to avoid collisions with other test data.
    const partTimeOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Physics 101",
          offeringIntensity: OfferingIntensity.partTime,
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const fullTimeOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Physics 201",
          offeringStatus: OfferingStatus.CreationPending,
          offeringIntensity: OfferingIntensity.fullTime,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    // Create the offerings in non alphabetical order for offeringIntensity to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    await db.educationProgramOffering.save([
      partTimeOffering,
      fullTimeOffering,
    ]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    const sortField = "offeringIntensity";
    const sortOrder = "ASC";
    // Include a search criteria that matches both offerings to avoid test data collisions.
    const searchCriteria = "Physics";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=2&sortField=${sortField}&sortOrder=${sortOrder}&searchCriteria=${searchCriteria}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          buildExpectedOffering(fullTimeOffering),
          buildExpectedOffering(partTimeOffering),
        ],
        count: 2,
      });
  });

  it("Should return a single pending offering based on offering name search", async () => {
    // Arrange

    // Create two offerings where only one matches the search criteria.
    // Custom dates are used to avoid collisions with other test data.
    const fortranOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Programming with Fortran",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    const algorithmsOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          name: "Introduction to Algorithms",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );
    await db.educationProgramOffering.save([
      fortranOffering,
      algorithmsOffering,
    ]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const searchCriteria = "Programming";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [buildExpectedOffering(fortranOffering)],
        count: 1,
      });
  });

  it("Should return no offerings when the Program is inactive.", async () => {
    // Arrange

    // Create an inactive Program.
    const inactiveProgram = createFakeEducationProgram(
      {
        auditUser: savedUser,
      },
      { initialValues: { isActive: false } },
    );
    await db.educationProgram.save(inactiveProgram);

    // Create an offering for the inactive Program.
    // Custom dates/names are used to avoid collisions with other test data.
    const psych101Offering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
        program: inactiveProgram,
      },
      {
        initialValues: {
          name: "Psychology 101",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    await db.educationProgramOffering.save([psych101Offering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Include a search criteria that matches both offerings to avoid test data collisions.
    const searchCriteria = "Psychology";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}`;

    // Act/Assert
    // No results are expected since the Program is inactive and we are searching on a specific name.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ results: [], count: 0 });
  });

  it("Should return no offerings when the Program is expired.", async () => {
    // Arrange

    // Create an expired Program.
    const expiredProgram = createFakeEducationProgram(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          effectiveEndDate: getISODateOnlyString(addDays(-1)),
        },
      },
    );
    await db.educationProgram.save(expiredProgram);

    // Create an offering for the expired Program.
    // Custom dates/names are used to avoid collisions with other test data.
    const psych101Offering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
        program: expiredProgram,
      },
      {
        initialValues: {
          name: "Psychology 101",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: PAST_SUBMITTED_DATE,
        },
      },
    );

    await db.educationProgramOffering.save([psych101Offering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    // Include a search criteria that matches both offerings to avoid test data collisions.
    const searchCriteria = "Psychology";
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=${searchCriteria}`;

    // Act/Assert
    // No results are expected since the Program is inactive and we are searching on a specific name.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({ results: [], count: 0 });
  });

  afterAll(async () => {
    await app?.close();
  });
});

function buildExpectedOffering(offering: EducationProgramOffering): unknown {
  return {
    id: offering.id,
    name: offering.name,
    studyStartDate: offering.studyStartDate,
    studyEndDate: offering.studyEndDate,
    offeringDelivered: offering.offeringDelivered,
    offeringIntensity: offering.offeringIntensity,
    offeringType: offering.offeringType,
    offeringStatus: offering.offeringStatus,
    submittedDate: offering.submittedDate.toISOString(),
    locationId: offering.institutionLocation.id,
    locationName: offering.institutionLocation.name,
    programId: offering.educationProgram.id,
    programName: offering.educationProgram.name,
    institutionId: offering.institutionLocation.institution.id,
  };
}
