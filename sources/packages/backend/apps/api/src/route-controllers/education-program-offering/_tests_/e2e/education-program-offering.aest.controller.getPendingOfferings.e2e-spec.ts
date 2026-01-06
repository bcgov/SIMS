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
import { EducationProgramOfferingPendingAPIOutDTO } from "../../models/education-program-offering.dto";
import { addDays, getISODateOnlyString } from "@sims/utilities";

const PAST_SUBMITTED_DATE = new Date("2000-01-01");
const FUTURE_SUBMITTED_DATE = new Date("2050-01-01");

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
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // There are three offerings but only 2 should be returned based on the page limit.
    expect(response.body.count).toEqual(3);
    expect(response.body.results.length).toEqual(2);

    // Assert the two oldest Pending Offerings are returned in the correct order.
    const [offeringResult1, offeringResult2] = response.body.results;
    assertPendingOffering(offeringResult1, oldestOffering);
    assertPendingOffering(offeringResult2, olderOffering);
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
          submittedDate: addDays(-1, FUTURE_SUBMITTED_DATE),
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
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.count).toEqual(2);

    // Assert the two newest Pending Offerings are returned in the correct order.
    const [offeringResult1, offeringResult2] = response.body.results;
    assertPendingOffering(offeringResult1, newerOffering);
    assertPendingOffering(offeringResult2, olderOffering);
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Three matches are expected based on the search criteria.
    expect(response.body.count).toEqual(3);

    // Assert the offerings are returned in the correct order.
    const [offeringResult1, offeringResult2, offeringResult3] =
      response.body.results;
    assertPendingOffering(offeringResult1, privateOffering);
    assertPendingOffering(offeringResult2, publicOffering);
    assertPendingOffering(offeringResult3, scholasticStandingOffering);
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
          submittedDate: FUTURE_SUBMITTED_DATE,
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
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Two matches are expected based on the search criteria.
    expect(response.body.count).toEqual(2);

    // Assert the offerings are returned in the correct order.
    const [offeringResult1, offeringResult2] = response.body.results;
    assertPendingOffering(offeringResult1, fullTimeOffering);
    assertPendingOffering(offeringResult2, partTimeOffering);
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
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // One match is expected based on the search criteria.
    expect(response.body.count).toEqual(1);

    // Assert the correct offering is returned.
    const [offeringResult] = response.body.results;
    assertPendingOffering(offeringResult, fortranOffering);
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

function assertPendingOffering(
  actualOffering: EducationProgramOfferingPendingAPIOutDTO,
  expectedOffering: EducationProgramOffering,
): void {
  expect(actualOffering).toEqual({
    id: expectedOffering.id,
    name: expectedOffering.name,
    studyStartDate: expectedOffering.studyStartDate,
    studyEndDate: expectedOffering.studyEndDate,
    offeringDelivered: expectedOffering.offeringDelivered,
    offeringIntensity: expectedOffering.offeringIntensity,
    offeringType: expectedOffering.offeringType,
    offeringStatus: expectedOffering.offeringStatus,
    submittedDate: expectedOffering.submittedDate.toISOString(),
    locationId: expectedOffering.institutionLocation.id,
    locationName: expectedOffering.institutionLocation.name,
    programId: expectedOffering.educationProgram.id,
    programName: expectedOffering.educationProgram.name,
    institutionId: expectedOffering.institutionLocation.institution.id,
  });
}
