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
import { EducationProgramOffering, OfferingStatus, User } from "@sims/sims-db";
import * as request from "supertest";
import { EducationProgramOfferingPendingAPIOutDTO } from "apps/api/src/route-controllers/education-program-offering/models/education-program-offering.dto";
import { addDays } from "@sims/utilities";

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
    const newerOffering = createFakeEducationProgramOffering(
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
    // Create the newer offering before the older offering to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    await db.educationProgramOffering.save([newerOffering, olderOffering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.count).toBeGreaterThanOrEqual(2);

    // Assert the two oldest Pending Offerings are returned in the correct order.
    const offeringResult1: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
    const offeringResult2: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[1];
    assertPendingOffering(offeringResult1, olderOffering);
    assertPendingOffering(offeringResult2, newerOffering);
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

    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.count).toBeGreaterThanOrEqual(2);

    // Assert the offerings are returned in the correct order.
    const offeringResult1: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
    const offeringResult2: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[1];
    assertPendingOffering(offeringResult1, newerOffering);
    assertPendingOffering(offeringResult2, olderOffering);
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
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=Programming`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Only a single match is expected based on the search criteria.
    expect(response.body.count).toEqual(1);

    // Assert the correct offering is returned.
    const offeringResult: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
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
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=Psychology`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // No results are expected since the Program is inactive and we are searching on a specific name.
    expect(response.body.count).toEqual(0);
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
          effectiveEndDate: addDays(-1, new Date()).toISOString(),
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
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=Psychology`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // No results are expected since the Program is inactive and we are searching on a specific name.
    expect(response.body.count).toEqual(0);
  });

  afterAll(async () => {
    await app?.close();
  });
});

function assertPendingOffering(
  expectedOffering: EducationProgramOfferingPendingAPIOutDTO,
  actualOffering: EducationProgramOffering,
): void {
  expect(expectedOffering).toEqual({
    id: actualOffering.id,
    name: actualOffering.name,
    studyStartDate: actualOffering.studyStartDate,
    studyEndDate: actualOffering.studyEndDate,
    offeringDelivered: actualOffering.offeringDelivered,
    offeringIntensity: actualOffering.offeringIntensity,
    offeringType: actualOffering.offeringType,
    offeringStatus: actualOffering.offeringStatus,
    submittedDate: actualOffering.submittedDate.toISOString(),
    locationId: actualOffering.institutionLocation.id,
    locationName: actualOffering.institutionLocation.name,
    programId: actualOffering.educationProgram.id,
    programName: actualOffering.educationProgram.name,
    institutionId: actualOffering.institutionLocation.institution.id,
  });
}
