import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  OfferingStatus,
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
import { In } from "typeorm";
import { convertStringToPEM } from "apps/api/src/utilities/certificate-utils";

jest.setTimeout(9000000);
describe("EducationProgramOfferingInstitutionsController(e2e)-bulkInsert", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let institutionUserToken: string;
  let endpoint: string;
  let csvLocationCodeYESK: string;
  let csvProgramSABCCodeSBC2: string;
  let csvLocationCodeKSEY: string;
  let csvProgramSABCCodeSBC4: string;
  let multipleOfferingFilePath: string;
  let singleOfferingFilePath: string;
  let singleOfferingWithValidationErrorsFilePath: string;

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

    // location code in the single and multiple CSV.
    csvLocationCodeYESK = "YESK";
    // SABC code in the single and multiple CSV.
    csvProgramSABCCodeSBC2 = "SBC2";
    // Second location code in the multiple CSV.
    csvLocationCodeKSEY = "KSEY";
    // Second SABC code in the multiple CSV.
    csvProgramSABCCodeSBC4 = "SBC4";

    institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    endpoint = "/institutions/education-program-offering/bulk-insert";

    multipleOfferingFilePath = path.join(
      __dirname,
      "bulk-insert/multiple-upload.csv",
    );
    singleOfferingFilePath = path.join(
      __dirname,
      "bulk-insert/single-upload.csv",
    );
    singleOfferingWithValidationErrorsFilePath = path.join(
      __dirname,
      "bulk-insert/single-upload-with-validation-errors.csv",
    );
  });

  it(
    "Should create a approved and a creation pending offerings from the bulk" +
      " offering CSV file with existing location code and SABC code, one with" +
      " same delivery method and another with different delivery method when uploaded.",
    async () => {
      // Arrange
      // Creating an institution location with same location code as that of the
      // first row of the multiple CSV file.
      const collegeFLocationYESK = createFakeInstitutionLocation(
        {
          institution: collegeF,
        },
        {
          initialValue: {
            institutionCode: csvLocationCodeYESK,
          } as Partial<InstitutionLocation>,
        },
      );
      // Creating an institution location with same location code as that of the
      // second row of the multiple CSV file.
      const collegeFLocationKSEY = createFakeInstitutionLocation(
        {
          institution: collegeF,
        },
        {
          initialValue: {
            institutionCode: csvLocationCodeKSEY,
          } as Partial<InstitutionLocation>,
        },
      );
      // Create a program for the institution with the same SABC code as that of the
      // first row of the multiple CSV file.
      // Setting deliveredOnSite as true, to create an approved offering.
      const educationProgramSBC2 = createFakeEducationProgram(
        collegeF,
        collegeFUser,
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC2,
            deliveredOnSite: true,
          } as Partial<EducationProgram>,
        },
      );
      // Create a program for the institution with the same SABC code as that of the
      // second row of the multiple CSV file.
      // In CSV delivery method does not match with the existing program, which will
      // create an 'Creation pending' application.
      const educationProgramSBC4 = createFakeEducationProgram(
        collegeF,
        collegeFUser,
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC4,
          } as Partial<EducationProgram>,
        },
      );
      await db.educationProgram.save([
        educationProgramSBC2,
        educationProgramSBC4,
      ]);

      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
        collegeFLocationYESK,
      );
      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
        collegeFLocationKSEY,
      );

      let [responseOfferingSBC2, responseOfferingSBC4] = [undefined, undefined];
      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .attach("file", multipleOfferingFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          [responseOfferingSBC2, responseOfferingSBC4] = response.body;
          expect(responseOfferingSBC2).toHaveProperty("id");
          expect(responseOfferingSBC4).toHaveProperty("id");
        });

      const [offeringSBC2, offeringSBC4] =
        await db.educationProgramOffering.find({
          select: {
            offeringStatus: true,
          },
          where: {
            id: In([responseOfferingSBC2.id, responseOfferingSBC4.id]),
          },
        });

      expect(offeringSBC2).toHaveProperty(
        "offeringStatus",
        OfferingStatus.Approved,
      );
      expect(offeringSBC4).toHaveProperty(
        "offeringStatus",
        OfferingStatus.CreationPending,
      );

      // Clear test data.
      await cleanTestData(
        csvProgramSABCCodeSBC2,
        collegeFLocationYESK,
        csvLocationCodeYESK,
      );
      await cleanTestData(
        csvProgramSABCCodeSBC4,
        collegeFLocationKSEY,
        csvLocationCodeKSEY,
      );
    },
  );

  it(
    "Should return validation warnings from the bulk offering CSV file with existing" +
      " location code and SABC code, with different delivery method and invalid study period" +
      " when uploaded.",
    async () => {
      // Arrange
      // Creating an institution location with same location code as that of the
      // single CSV file.
      const collegeFLocationYESK = createFakeInstitutionLocation(
        {
          institution: collegeF,
        },
        {
          initialValue: {
            institutionCode: csvLocationCodeYESK,
          } as Partial<InstitutionLocation>,
        },
      );

      // Create a program for the institution with the same SABC code as that of the
      // single CSV file.
      // In CSV delivery method is onsite, which does not match with the existing program.
      const educationProgramSBC2 = createFakeEducationProgram(
        collegeF,
        collegeFUser,
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC2,
          } as Partial<EducationProgram>,
        },
      );

      await db.educationProgram.save(educationProgramSBC2);

      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
        collegeFLocationYESK,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(`${endpoint}?validation-only=true`)
        .attach("file", singleOfferingWithValidationErrorsFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: "An offering has invalid data.",
          errorType: "OFFERING_VALIDATION_CRITICAL_ERROR",
          objectInfo: [
            {
              recordIndex: 0,
              locationCode: csvLocationCodeYESK,
              sabcProgramCode: csvProgramSABCCodeSBC2,
              startDate: "2023-09-06",
              endDate: "2023-10-15",
              offeringStatus: "Creation pending",
              errors: [],
              infos: [],
              warnings: [
                {
                  typeCode: "invalidStudyDatesPeriodLength",
                  message:
                    "End date, the number of day(s) between Sep 06 2023 and Oct 15 2023 must be at least 84.",
                },
                {
                  typeCode: "programOfferingDeliveryMismatch",
                  message:
                    "Delivery type has an offering delivery that is not allowed by its program.",
                },
              ],
            },
          ],
        });

      // Clear test data.
      await cleanTestData(
        csvProgramSABCCodeSBC2,
        collegeFLocationYESK,
        csvLocationCodeYESK,
      );
    },
  );

  it("Should return program related validation error when bulk offering CSV file with a non existing program SABC code when uploaded. ", async () => {
    // Arrange
    const randomSABCCode = `XXXX1`;

    // Creating an institution location with same location code as that of the CSV file.
    const collegeFLocation = createFakeInstitutionLocation(
      {
        institution: collegeF,
      },
      {
        initialValue: {
          institutionCode: csvLocationCodeYESK,
        } as Partial<InstitutionLocation>,
      },
    );

    // Create a program for the institution with the same sabc code as that of th CSV file.
    const educationProgram = createFakeEducationProgram(
      collegeF,
      collegeFUser,
      {
        initialValue: {
          sabcCode: randomSABCCode,
        } as Partial<EducationProgram>,
      },
    );
    await db.educationProgram.save(educationProgram);

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", singleOfferingFilePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "An offering has invalid data.",
        errorType: "OFFERING_VALIDATION_CRITICAL_ERROR",
        objectInfo: [
          {
            recordIndex: 0,
            locationCode: csvLocationCodeYESK,
            sabcProgramCode: csvProgramSABCCodeSBC2,
            startDate: "2023-09-06",
            endDate: "2024-08-15",
            errors: [
              "Not able to find a program related to this offering or it was not provided.",
            ],
            infos: [],
            warnings: [],
          },
        ],
      });

    // Clear test data.
    await cleanTestData(randomSABCCode, collegeFLocation, csvLocationCodeYESK);
  });

  it(
    "Should return institution location validation errors and delivery method warning " +
      "error when bulk offering CSV file with a non existing location code when uploaded and program with different delivery method.",
    async () => {
      // Arrange
      // Creating an institution location with same location code as that of the CSV file.
      const collegeFLocation = createFakeInstitutionLocation({
        institution: collegeF,
      });
      // Create a program for the institution with the same SABC code as that of th CSV file.
      const educationProgramSBC2 = createFakeEducationProgram(
        collegeF,
        collegeFUser,
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC2,
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
        .attach("file", singleOfferingFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: "An offering has invalid data.",
          errorType: "OFFERING_VALIDATION_CRITICAL_ERROR",
          objectInfo: [
            {
              recordIndex: 0,
              locationCode: csvLocationCodeYESK,
              sabcProgramCode: csvProgramSABCCodeSBC2,
              startDate: "2023-09-06",
              endDate: "2024-08-15",
              errors: [
                "Related institution location was not found or was not provided.",
              ],
              infos: [],
              warnings: [
                {
                  typeCode: "programOfferingDeliveryMismatch",
                  message:
                    "Delivery type has an offering delivery that is not allowed by its program.",
                },
              ],
            },
          ],
        });

      // Clear test data.
      await cleanTestData(csvProgramSABCCodeSBC2, collegeFLocation);
    },
  );

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
