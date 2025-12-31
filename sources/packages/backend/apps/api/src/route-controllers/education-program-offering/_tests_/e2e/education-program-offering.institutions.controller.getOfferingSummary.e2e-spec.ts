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
  createFakeEducationProgram,
  createFakeUser,
} from "@sims/test-utils";
import {
  OfferingIntensity,
  InstitutionUserTypes,
  EducationProgram,
  InstitutionLocation,
  EducationProgramOffering,
} from "@sims/sims-db";

describe("EducationProgramOfferingInstitutionsController(e2e)-getOfferingSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let baseEndpoint: string;
  let program: EducationProgram;
  let institutionLocation: InstitutionLocation;

  /**
   * Creates a fake full-time education program offering with an optional custom name.
   * @param offeringCustomName Optional custom name for the offering.
   * @returns The saved full-time education program offering.
   */
  const createFakeFullTimeOffering = async (
    offeringCustomName?: string,
  ): Promise<EducationProgramOffering> => {
    const fullTimeOffering = createFakeEducationProgramOffering(
      program,
      institutionLocation,
    );

    fullTimeOffering.offeringIntensity = OfferingIntensity.fullTime;
    fullTimeOffering.studyStartDate = "2024-08-01";
    fullTimeOffering.studyEndDate = "2024-12-31";
    fullTimeOffering.name = offeringCustomName ?? "Full-Time Test Offering";

    return await db.educationProgramOffering.save(fullTimeOffering);
  };

  /**
   * Creates a fake part-time education program offering.
   * @returns The saved part-time education program offering.
   */
  const createFakePartTimeOffering =
    async (): Promise<EducationProgramOffering> => {
      const partTimeOffering = createFakeEducationProgramOffering(
        program,
        institutionLocation,
      );

      partTimeOffering.offeringIntensity = OfferingIntensity.partTime;
      partTimeOffering.studyStartDate = "2025-01-01";
      partTimeOffering.studyEndDate = "2025-05-31";
      partTimeOffering.name = "Part-Time Test Offering";
      return await db.educationProgramOffering.save(partTimeOffering);
    };

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
    institutionLocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeCUser,
      InstitutionUserTypes.admin,
    );

    program = createFakeEducationProgram({
      institution: institution,
      auditUser: sharedUser,
    });
    program = await db.educationProgram.save(program);

    baseEndpoint = `/institutions/education-program-offering/location/${institutionLocation.id}/education-program/${program.id}?page=0&pageLimit=10`;
  });

  it("Should return all offerings when no filters are applied.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const fullTimeOffering = await createFakeFullTimeOffering();
    const partTimeOffering = await createFakePartTimeOffering();
    const endpoint = baseEndpoint;

    // Act/Assert
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
    const fullTimeOffering = await createFakeFullTimeOffering();

    // Act/Assert
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
    const partTimeOffering = await createFakePartTimeOffering();

    // Act/Assert
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
    const fullTimeOffering = await createFakeFullTimeOffering();
    const endpoint = `${baseEndpoint}&studyStartDateFromFilter=${startDateFrom}&studyStartDateToFilter=${startDateTo}`;

    // Act/Assert
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
    const fullTimeOffering = await createFakeFullTimeOffering();

    // Act/Assert
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
    const fullTimeOffering = await createFakeFullTimeOffering();
    await createFakeFullTimeOffering("fake other name");
    const searchableName = encodeURIComponent(fullTimeOffering.name);
    const intensityFilter = encodeURIComponent(OfferingIntensity.fullTime);
    const endpoint = `${baseEndpoint}&searchCriteria=${searchableName}&intensityFilter=${intensityFilter}`;

    // Act/Assert
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
    const fullTimeOffering = await createFakeFullTimeOffering();
    const partTimeOffering = await createFakePartTimeOffering();

    // Act/Assert
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

    // Act/Assert
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
