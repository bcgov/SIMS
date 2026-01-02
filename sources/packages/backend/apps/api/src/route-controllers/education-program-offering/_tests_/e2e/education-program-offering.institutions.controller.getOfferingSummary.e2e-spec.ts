import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
  getAuthorizedLocation,
} from "../../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  createFakeEducationProgramOffering,
  createFakeUser,
  createFakeEducationProgram,
} from "@sims/test-utils";
import {
  OfferingIntensity,
  InstitutionUserTypes,
  EducationProgram,
  InstitutionLocation,
  EducationProgramOffering,
  User,
  Institution,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";

describe("EducationProgramOfferingInstitutionsController(e2e)-getOfferingSummary", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let baseEndpoint: string;
  let institution: Institution;
  let institutionLocation: InstitutionLocation;
  let sharedUser: User;
  /**
   * Creates a fake full-time education program offering with an optional custom name.
   * @param offeringCustomName Optional custom name for the offering.
   * @returns The saved full-time education program offering.
   */
  const createFakeOffering = async (
    offeringIntensity: OfferingIntensity,
    program?: EducationProgram,
  ): Promise<EducationProgramOffering> => {
    if (!program) {
      program = await db.educationProgram.save(
        createFakeEducationProgram({
          institution: institution,
          auditUser: sharedUser,
        }),
      );
    }

    const fullTimeOffering = createFakeEducationProgramOffering(
      {
        auditUser: sharedUser,
        program: program,
        institutionLocation: institutionLocation,
      },
      {
        initialValues: {
          offeringIntensity: offeringIntensity,
        },
      },
    );

    return await db.educationProgramOffering.save(fullTimeOffering);
  };

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);

    sharedUser = createFakeUser();
    await db.user.save(sharedUser);

    // Get College C institution and location.
    const authRelatedEntities = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
    );
    institution = authRelatedEntities.institution;
    institutionLocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeCUser,
      InstitutionUserTypes.admin,
    );

    baseEndpoint = `/institutions/education-program-offering/location/${institutionLocation.id}`;
  });

  it("Should return all offerings when no filters are applied.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );
    const fullTimeOffering2 = await createFakeOffering(
      OfferingIntensity.fullTime,
      fullTimeOffering.educationProgram,
    );
    const partTimeOffering = await createFakeOffering(
      OfferingIntensity.partTime,
      fullTimeOffering.educationProgram,
    );
    const sortField = "name";
    const sortOrder = "ASC";
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&sortField=${sortField}&sortOrder=${sortOrder}`;
    const sortedOfferings = [
      fullTimeOffering,
      fullTimeOffering2,
      partTimeOffering,
    ].sort((a, b) => a.name.localeCompare(b.name));

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: sortedOfferings[0].id,
            name: sortedOfferings[0].name,
            yearOfStudy: sortedOfferings[0].yearOfStudy,
            studyStartDate: sortedOfferings[0].studyStartDate,
            studyEndDate: sortedOfferings[0].studyEndDate,
            offeringDelivered: sortedOfferings[0].offeringDelivered,
            offeringIntensity: sortedOfferings[0].offeringIntensity,
            offeringType: sortedOfferings[0].offeringType,
            offeringStatus: sortedOfferings[0].offeringStatus,
          },
          {
            id: sortedOfferings[1].id,
            name: sortedOfferings[1].name,
            yearOfStudy: sortedOfferings[1].yearOfStudy,
            studyStartDate: sortedOfferings[1].studyStartDate,
            studyEndDate: sortedOfferings[1].studyEndDate,
            offeringDelivered: sortedOfferings[1].offeringDelivered,
            offeringIntensity: sortedOfferings[1].offeringIntensity,
            offeringType: sortedOfferings[1].offeringType,
            offeringStatus: sortedOfferings[1].offeringStatus,
          },
          {
            id: sortedOfferings[2].id,
            name: sortedOfferings[2].name,
            yearOfStudy: sortedOfferings[2].yearOfStudy,
            studyStartDate: sortedOfferings[2].studyStartDate,
            studyEndDate: sortedOfferings[2].studyEndDate,
            offeringDelivered: sortedOfferings[2].offeringDelivered,
            offeringIntensity: sortedOfferings[2].offeringIntensity,
            offeringType: sortedOfferings[2].offeringType,
            offeringStatus: sortedOfferings[2].offeringStatus,
          },
        ],
        count: sortedOfferings.length,
      });
  });

  it("Should filter offerings by Full-time intensity.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const intensityFilter = encodeURIComponent(OfferingIntensity.fullTime);
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&intensityFilter=${intensityFilter}`;

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
    const partTimeOffering = await createFakeOffering(
      OfferingIntensity.partTime,
    );
    const endpoint = `${baseEndpoint}/education-program/${partTimeOffering.educationProgram.id}?page=0&pageLimit=10&intensityFilter=${intensityFilter}`;

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
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );

    const startDateFrom = getISODateOnlyString(
      addDays(-15, fullTimeOffering.studyStartDate),
    );
    const startDateTo = getISODateOnlyString(
      addDays(15, fullTimeOffering.studyStartDate),
    );

    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&studyStartDateFromFilter=${startDateFrom}&studyStartDateToFilter=${startDateTo}`;

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
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );
    // Second offering to ensure only the searched one is returned.
    await createFakeOffering(
      OfferingIntensity.fullTime,
      fullTimeOffering.educationProgram,
    );
    const searchableName = fullTimeOffering.name;
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&searchCriteria=${searchableName}`;

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
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );
    await createFakeOffering(
      OfferingIntensity.fullTime,
      fullTimeOffering.educationProgram,
    );
    const searchableName = encodeURIComponent(fullTimeOffering.name);
    const intensityFilter = encodeURIComponent(OfferingIntensity.fullTime);
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&searchCriteria=${searchableName}&intensityFilter=${intensityFilter}`;
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
    const sortOrder = "ASC";
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );
    const partTimeOffering = await createFakeOffering(
      OfferingIntensity.partTime,
      fullTimeOffering.educationProgram,
    );
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&sortField=${sortField}&sortOrder=${sortOrder}`;

    const sortedOfferings = [fullTimeOffering, partTimeOffering].sort((a, b) =>
      a.name.localeCompare(b.name),
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        results: [
          {
            id: sortedOfferings[0].id,
            name: sortedOfferings[0].name,
            yearOfStudy: sortedOfferings[0].yearOfStudy,
            studyStartDate: sortedOfferings[0].studyStartDate,
            studyEndDate: sortedOfferings[0].studyEndDate,
            offeringDelivered: sortedOfferings[0].offeringDelivered,
            offeringIntensity: sortedOfferings[0].offeringIntensity,
            offeringType: sortedOfferings[0].offeringType,
            offeringStatus: sortedOfferings[0].offeringStatus,
          },
          {
            id: sortedOfferings[1].id,
            name: sortedOfferings[1].name,
            yearOfStudy: sortedOfferings[1].yearOfStudy,
            studyStartDate: sortedOfferings[1].studyStartDate,
            studyEndDate: sortedOfferings[1].studyEndDate,
            offeringDelivered: sortedOfferings[1].offeringDelivered,
            offeringIntensity: sortedOfferings[1].offeringIntensity,
            offeringType: sortedOfferings[1].offeringType,
            offeringStatus: sortedOfferings[1].offeringStatus,
          },
        ],
        count: 2,
      });
  });

  it("Should return empty results when filters do not match any offerings.", async () => {
    // Arrange
    const token = await getInstitutionToken(InstitutionTokenTypes.CollegeCUser);
    const fullTimeOffering = await createFakeOffering(
      OfferingIntensity.fullTime,
    );

    const nonExistentName = `NonExistentOffering_${Date.now()}`;
    const endpoint = `${baseEndpoint}/education-program/${fullTimeOffering.educationProgram.id}?page=0&pageLimit=10&searchCriteria=${nonExistentName}`;

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
