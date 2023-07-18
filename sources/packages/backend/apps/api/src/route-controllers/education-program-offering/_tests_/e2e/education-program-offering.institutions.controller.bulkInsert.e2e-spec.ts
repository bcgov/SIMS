import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
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
import * as path from "path";

jest.setTimeout(9000000);
describe("EducationProgramOfferingInstitutionsController(e2e)-bulkInsert", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let institutionUserToken: string;
  let endpoint: string;
  let csvLocationCode: string;
  let csvProgramSABCCode: string;
  let filePath: string;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user: institutionUser } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFUser = institutionUser;

    // location code, as that of CSV.
    csvLocationCode = "YESK";
    // SABC code, as that of CSV.
    csvProgramSABCCode = "SBC2";
    institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    endpoint = "/institutions/education-program-offering/bulk-insert";
    filePath = path.join(__dirname, "bulk-insert/success-upload.csv");
  });
  // todo: add multiple entry case, maybe one with approved status and one with pending with ministry status
  it("Should create offering from the bulk offering CSV file with existing location code and SABC code when uploaded.", async () => {
    // Arrange
    // Creating an institution location with same location code as that of the CSV file.
    collegeFLocation = createFakeInstitutionLocation(
      {
        institution: collegeF,
      },
      {
        initialValue: {
          institutionCode: csvLocationCode,
        } as Partial<InstitutionLocation>,
      },
    );
    // Create a program for the institution with the same SABC code as that of th CSV file.
    const educationProgramSBC2 = createFakeEducationProgram(
      collegeF,
      collegeFUser,
      {
        initialValue: {
          sabcCode: csvProgramSABCCode,
        } as Partial<EducationProgram>,
      },
    );
    await db.educationProgram.save(educationProgramSBC2);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", filePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        const returnedResult = response.body[0];
        expect(returnedResult).toHaveProperty("id");
      });

    // Clear test data.
    await cleanTestData(csvProgramSABCCode, collegeFLocation, csvLocationCode);
  });

  // todo: add validation too, so, that its error +validations
  it("Should return validation error when bulk offering CSV file with a non existing location code when uploaded. ", async () => {
    // Arrange
    // Creating an institution location with same location code as that of the CSV file.
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    // Create a program for the institution with the same sabc code as that of th CSV file.
    const educationProgramSBC2 = createFakeEducationProgram(
      collegeF,
      collegeFUser,
      {
        initialValue: {
          sabcCode: csvProgramSABCCode,
          deliveredOnSite: true,
        } as Partial<EducationProgram>,
      },
    );
    await db.educationProgram.save(educationProgramSBC2);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", filePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "An offering has invalid data.",
        errorType: "OFFERING_VALIDATION_CRITICAL_ERROR",
        objectInfo: [
          {
            recordIndex: 0,
            locationCode: "YESK",
            sabcProgramCode: csvProgramSABCCode,
            startDate: "2023-09-06",
            endDate: "2024-08-15",
            errors: [
              "Related institution location was not found or was not provided.",
            ],
            infos: [],
            warnings: [],
          },
        ],
      });

    // Clear test data.
    await cleanTestData(csvProgramSABCCode, collegeFLocation);
  });

  // todo: update the description - without program
  it.only("Should return validation error when bulk offering CSV file with a non existing location code when uploaded. ", async () => {
    // Arrange
    // Creating an institution location with same location code as that of the CSV file.
    collegeFLocation = createFakeInstitutionLocation(
      {
        institution: collegeF,
      },
      {
        initialValue: {
          institutionCode: csvLocationCode,
        } as Partial<InstitutionLocation>,
      },
    );
    // Creating an institution location with same location code as that of the CSV file.
    collegeFLocation = createFakeInstitutionLocation({
      institution: collegeF,
    });
    // Create a program for the institution with the same sabc code as that of th CSV file.
    const educationProgramSBC2 = createFakeEducationProgram(
      collegeF,
      collegeFUser,
    );
    await db.educationProgram.save(educationProgramSBC2);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", filePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect((response) => {
        console.log(response.body);
      });
    // .expect({
    //   message: "An offering has invalid data.",
    //   errorType: "OFFERING_VALIDATION_CRITICAL_ERROR",
    //   objectInfo: [
    //     {
    //       recordIndex: 0,
    //       locationCode: "YESK",
    //       sabcProgramCode: csvProgramSABCCode,
    //       startDate: "2023-09-06",
    //       endDate: "2024-08-15",
    //       errors: [
    //         "Related institution location was not found or was not provided.",
    //       ],
    //       infos: [],
    //       warnings: [],
    //     },
    //   ],
    // });

    // Clear test data.
    await cleanTestData(csvProgramSABCCode, collegeFLocation);
  });
  /**
   * Clear the test data.
   * @param sabcCode sabcCode related entity to be deleted.
   * @param location location related entity to be deleted.
   * @param locationCode locationCode related entity to be deleted.
   */
  async function cleanTestData(
    sabcCode: string,
    location: InstitutionLocation,
    locationCode?: string,
  ): Promise<void> {
    await db.institutionUserAuth.delete({
      location: {
        id: location.id,
      },
    });
    await db.educationProgramOffering.delete({
      institutionLocation: {
        id: location.id,
      },
    });
    await db.educationProgram.delete({ sabcCode: sabcCode });
    if (locationCode) {
      await db.institutionLocation.delete({ institutionCode: locationCode });
    }
  }

  afterAll(async () => {
    await app?.close();
  });
});
