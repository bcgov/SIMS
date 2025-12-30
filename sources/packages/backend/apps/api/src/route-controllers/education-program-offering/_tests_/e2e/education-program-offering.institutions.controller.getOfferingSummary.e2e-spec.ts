import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
  createFakeEducationProgramOffering,
  getAuthorizedLocation,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  OfferingDeliveryOptions,
  createFakeEducationProgram,
  createFakeUser,
} from "@sims/test-utils";
import {
  OfferingIntensity,
  OfferingStatus,
  InstitutionUserTypes,
  EducationProgramOffering,
} from "@sims/sims-db";

describe("EducationProgramOfferingInstitutionsController(e2e)-getOfferingSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let fullTimeOffering: EducationProgramOffering;
  let partTimeOffering: EducationProgramOffering;
  let baseEndpoint: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    const sharedUser = createFakeUser();
    await db.user.save(sharedUser);

    // Get College C institution and location.
    const { institution } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    const collegeC = institution;
    const collegeCLocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeCUser,
      InstitutionUserTypes.admin,
    );

    const program = createFakeEducationProgram({
      institution: collegeC,
      auditUser: sharedUser,
    });
    await db.educationProgram.save(program);

    // Create test offerings with different intensities and dates.
    fullTimeOffering = createFakeEducationProgramOffering(
      program,
      collegeCLocation,
    );

    fullTimeOffering.offeringIntensity = OfferingIntensity.fullTime;
    fullTimeOffering.studyStartDate = "2024-08-01";
    fullTimeOffering.studyEndDate = "2024-12-31";
    fullTimeOffering.offeringStatus = OfferingStatus.Approved;
    fullTimeOffering.offeringDelivered = OfferingDeliveryOptions.Online;
    fullTimeOffering.name = "Full-Time Test Offering";

    await db.educationProgramOffering.save(fullTimeOffering);

    partTimeOffering = createFakeEducationProgramOffering(
      program,
      collegeCLocation,
    );

    partTimeOffering.offeringIntensity = OfferingIntensity.partTime;
    partTimeOffering.studyStartDate = "2025-01-01";
    partTimeOffering.studyEndDate = "2025-05-31";
    partTimeOffering.offeringStatus = OfferingStatus.Approved;
    partTimeOffering.offeringDelivered = OfferingDeliveryOptions.Blended;
    partTimeOffering.name = "Part-Time Test Offering";
    await db.educationProgramOffering.save(partTimeOffering);

    baseEndpoint = `/institutions/education-program-offering/location/${collegeCLocation.id}/education-program/${program.id}?page=0&pageLimit=10`;
  });

  it("Should return all offerings when no filters are applied.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);

    const endpoint = baseEndpoint;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
          {
            id: partTimeOffering.id,
            name: partTimeOffering.name,
            yearOfStudy: partTimeOffering.yearOfStudy,
            studyStartDate: partTimeOffering.studyStartDate,
            studyEndDate: partTimeOffering.studyEndDate,
            offeringDelivered: partTimeOffering.offeringDelivered,
            offeringIntensity: partTimeOffering.offeringIntensity,
            offeringType: partTimeOffering.offeringType,
            offeringStatus: partTimeOffering.offeringStatus,
          },
        ],
        count: 2,
      });
  });

  it("Should filter offerings by Full-time intensity.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const intensityFilter = encodeURIComponent(OfferingIntensity.fullTime);
    const endpoint = `${baseEndpoint}&intensityFilter=${intensityFilter}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should filter offerings by Part-time intensity.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const intensityFilter = encodeURIComponent(OfferingIntensity.partTime);
    const endpoint = `${baseEndpoint}&intensityFilter=${intensityFilter}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: partTimeOffering.id,
            name: partTimeOffering.name,
            yearOfStudy: partTimeOffering.yearOfStudy,
            studyStartDate: partTimeOffering.studyStartDate,
            studyEndDate: partTimeOffering.studyEndDate,
            offeringDelivered: partTimeOffering.offeringDelivered,
            offeringIntensity: partTimeOffering.offeringIntensity,
            offeringType: partTimeOffering.offeringType,
            offeringStatus: partTimeOffering.offeringStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should filter offerings by study start date range.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const startDateFrom = "2024-08-01";
    const startDateTo = "2024-12-31";

    const endpoint = `${baseEndpoint}&studyStartDateFromFilter=${startDateFrom}&studyStartDateToFilter=${startDateTo}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should filter offerings by offering name search.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const searchableName = "Full-Time";
    const endpoint = `${baseEndpoint}&searchCriteria=${searchableName}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should apply multiple filters together (intensity and search).", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const searchableName = encodeURIComponent(fullTimeOffering.name);
    const intensityFilter = encodeURIComponent(OfferingIntensity.fullTime);
    const endpoint = `${baseEndpoint}&searchCriteria=${searchableName}&intensityFilter=${intensityFilter}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
        ],
        count: 1,
      });
  });

  it("Should return results sorted by name in ascending order.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const sortField = "name";
    const endpoint = `${baseEndpoint}&sortField=${sortField}`;

    // Act & Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: fullTimeOffering.id,
            name: fullTimeOffering.name,
            yearOfStudy: fullTimeOffering.yearOfStudy,
            studyStartDate: fullTimeOffering.studyStartDate,
            studyEndDate: fullTimeOffering.studyEndDate,
            offeringDelivered: fullTimeOffering.offeringDelivered,
            offeringIntensity: fullTimeOffering.offeringIntensity,
            offeringType: fullTimeOffering.offeringType,
            offeringStatus: fullTimeOffering.offeringStatus,
          },
          {
            id: partTimeOffering.id,
            name: partTimeOffering.name,
            yearOfStudy: partTimeOffering.yearOfStudy,
            studyStartDate: partTimeOffering.studyStartDate,
            studyEndDate: partTimeOffering.studyEndDate,
            offeringDelivered: partTimeOffering.offeringDelivered,
            offeringIntensity: partTimeOffering.offeringIntensity,
            offeringType: partTimeOffering.offeringType,
            offeringStatus: partTimeOffering.offeringStatus,
          },
        ],
        count: 2,
      });
  });

  it("Should return empty results when filters do not match any offerings.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);

    const nonExistentName = `NonExistentOffering_${Date.now()}`;
    const endpoint = `${baseEndpoint}&searchCriteria=${nonExistentName}`;

    // Act & Assert
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
