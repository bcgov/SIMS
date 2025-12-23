import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  authorizeUserTokenForLocation,
  createTestingAppModule,
  getAESTToken,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
  createFakeInstitutionLocation,
  createFakeUser,
} from "@sims/test-utils";
import {
  EducationProgramOffering,
  InstitutionLocation,
  OfferingStatus,
  User,
} from "@sims/sims-db";
import * as request from "supertest";
import { EducationProgramOfferingPendingAPIOutDTO } from "apps/api/src/route-controllers/education-program-offering/models/education-program-offering.dto";
import { addDays } from "@sims/utilities";

const PAST_SUBMITTED_DATE = new Date("2000-01-01");
const FUTURE_SUBMITTED_DATE = new Date("2050-01-01");

describe("EducationProgramOfferingAESTController(e2e)-getPendingOfferings", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeFLocation: InstitutionLocation;
  let savedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution: collegeF } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    savedUser = await db.user.save(createFakeUser());
  });

  it("Should return two pending offerings for an active Program with the default sort (submittedDate ASC) applied", async () => {
    // Arrange

    // Create the newer offering before the older offering to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    const newerOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringDelivered: "Online",
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
          offeringDelivered: "Online",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-1, PAST_SUBMITTED_DATE),
        },
      },
    );
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

    // Assert only the two oldest Pending Offerings are returned in the correct order.
    const offering1: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
    const offering2: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[1];
    assertPendingOffering(offering1, olderOffering);
    assertPendingOffering(offering2, newerOffering);
  });

  it("Should return the newest offering first based on a custom sort", async () => {
    // Arrange

    // Create the newer offering before the older offering to ensure that our default
    // sort works and that we're not just getting default DB ordering.
    const newerOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringDelivered: "Online",
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
          offeringDelivered: "Online",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-1, FUTURE_SUBMITTED_DATE),
        },
      },
    );
    await db.educationProgramOffering.save([newerOffering, olderOffering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=DESC`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    expect(response.body.count).toBeGreaterThanOrEqual(2);

    // Assert only the two oldest Pending Offerings are returned in the correct order.
    const offering1: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
    const offering2: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[1];
    assertPendingOffering(offering1, newerOffering);
    assertPendingOffering(offering2, olderOffering);
  });

  it("Should return the offering based on partial name search", async () => {
    // Arrange

    const newerOffering = createFakeEducationProgramOffering(
      {
        auditUser: savedUser,
      },
      {
        initialValues: {
          offeringDelivered: "Online",
          name: "Programming with Fortran",
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
          offeringDelivered: "Online",
          offeringStatus: OfferingStatus.CreationPending,
          submittedDate: addDays(-1, PAST_SUBMITTED_DATE),
        },
      },
    );
    await db.educationProgramOffering.save([newerOffering, olderOffering]);

    // Ministry token.
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);
    const endpoint = `/aest/education-program-offering/pending?page=0&pageLimit=10&searchCriteria=Programming`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    // Only a single match is expected based on the search critieria.
    expect(response.body.count).toEqual(1);

    // Assert the correct offering is returned.
    const offering1: EducationProgramOfferingPendingAPIOutDTO =
      response.body.results[0];
    assertPendingOffering(offering1, newerOffering);
  });

  it("Should return no offerings when the Program is inactive", async () => {
    // TODO
    //   // Arrange
    // const offering = createFakeEducationProgramOffering({
    //   auditUser: savedUser,
    // });
    // const program = offering.educationProgram;
    // program.isActive = false;
    // await db.educationProgram.save(program);
    // firstOffering.offeringStatus = OfferingStatus.CreationPending;
    // secondOffering.offeringStatus = OfferingStatus.CreationPending;
    // await db.educationProgramOffering.save([firstOffering, secondOffering]);
  });

  afterAll(async () => {
    await app?.close();
  });
});

function assertPendingOffering(
  expectedOffering: EducationProgramOfferingPendingAPIOutDTO,
  actualOffering: EducationProgramOffering,
) {
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
