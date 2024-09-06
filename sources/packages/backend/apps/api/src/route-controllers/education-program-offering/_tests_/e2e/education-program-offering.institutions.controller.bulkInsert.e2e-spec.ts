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
import { OFFERING_VALIDATION_CRITICAL_ERROR } from "../../../../constants";
import { OfferingValidationWarnings } from "../../../../services";
import {
  MAX_ALLOWED_OFFERING_AMOUNT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
} from "../../../../utilities";

describe("EducationProgramOfferingInstitutionsController(e2e)-bulkInsert", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let institutionUserToken: string;
  let endpoint: string;
  let csvLocationCodeYESK: string;
  let collegeFLocationYESK: InstitutionLocation;
  let csvProgramSABCCodeSBC1: string;
  let csvProgramSABCCodeSBC9: string;

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

    // Location code in the single and multiple CSV files.
    csvLocationCodeYESK = "YESK";
    // SABC code in the single and multiple CSV files.
    csvProgramSABCCodeSBC1 = "SBC1";
    // SABC code in the single CSV files, where offering cost exceeds maximum.
    csvProgramSABCCodeSBC9 = "SBC9";

    institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Create a program for the institution with the same SABC code as that of the
    // CSV file.
    const educationProgramSBC1 = createFakeEducationProgram(
      { institution: collegeF, user: collegeFUser },
      {
        initialValue: {
          sabcCode: csvProgramSABCCodeSBC1,
        } as Partial<EducationProgram>,
      },
    );
    await db.educationProgram.save(educationProgramSBC1);
    // Create a program for the institution with the same SABC code as that of the
    // CSV file where offering cost exceeds maximum.
    const educationProgramSBC9 = createFakeEducationProgram(
      { institution: collegeF, user: collegeFUser },
      {
        initialValue: {
          sabcCode: csvProgramSABCCodeSBC9,
          deliveredOnSite: true,
        } as Partial<EducationProgram>,
      },
    );
    await db.educationProgram.save(educationProgramSBC9);

    endpoint = "/institutions/education-program-offering/bulk-insert";

    // Arrange
    // Creating an institution location with same location code as that of the
    // CSV file.
    collegeFLocationYESK = createFakeInstitutionLocation(
      {
        institution: collegeF,
      },
      {
        initialValue: {
          institutionCode: csvLocationCodeYESK,
        } as Partial<InstitutionLocation>,
      },
    );

    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocationYESK,
    );
  });

  it(
    "Should create an approved and a creation pending offerings when a multi line bulk" +
      " offering CSV file with existing location code and SABC code, and one with" +
      " same delivery method and another with different delivery method is uploaded.",
    async () => {
      // Arrange
      // Second location code in the multiple CSV.
      const csvLocationCodeKSEY = "KSEY";
      // SABC code in the second row of the multiple CSV.
      const csvProgramSABCCodeSBC2 = "SBC2";

      // Creating an institution location with same location code as that of the
      // second row in the CSV file.
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
      // second row of the multiple CSV file.
      // Setting deliveredOnSite as true, as that of the CSV, so that it will create an approved offering.
      const educationProgramSBC2 = createFakeEducationProgram(
        { institution: collegeF, user: collegeFUser },
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC2,
            deliveredOnSite: true,
          } as Partial<EducationProgram>,
        },
      );

      await db.educationProgram.save(educationProgramSBC2);

      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
        collegeFLocationKSEY,
      );

      const multipleOfferingFilePath = path.join(
        __dirname,
        "bulk-insert/multiple-upload.csv",
      );

      let responseOfferingSBC1: EducationProgram,
        responseOfferingSBC2: EducationProgram;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .attach("file", multipleOfferingFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          [responseOfferingSBC1, responseOfferingSBC2] = response.body;
          expect(responseOfferingSBC1).toHaveProperty("id");
          expect(responseOfferingSBC2).toHaveProperty("id");
        });

      // Checking the created offering statuses.
      const [offeringSBC1, offeringSBC2] =
        await db.educationProgramOffering.find({
          select: {
            offeringStatus: true,
            name: true,
          },
          where: {
            id: In([responseOfferingSBC1.id, responseOfferingSBC2.id]),
          },
          order: {
            name: "ASC",
          },
        });

      // Delivery method of the program 'SBC1' in the CSV does not match with the existing program, which will
      // create an 'Creation pending' offering when inserted.

      expect(offeringSBC1).toEqual({
        name: "Test áéíóú",
        offeringStatus: OfferingStatus.CreationPending,
      });
      expect(offeringSBC2).toHaveProperty(
        "offeringStatus",
        OfferingStatus.Approved,
      );
    },
  );

  it(
    "Should return validation warnings when bulk offering CSV file with existing" +
      " location code and SABC code, with different delivery method and invalid study period" +
      " is uploaded.",
    async () => {
      // Arrange
      const singleOfferingWithValidationErrorsFilePath = path.join(
        __dirname,
        "bulk-insert/single-upload-with-validation-errors.csv",
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(`${endpoint}?validation-only=true`)
        .attach("file", singleOfferingWithValidationErrorsFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect((response) => {
          console.log("response.body: ", response.body);
          expect(response.body).toEqual({
            message: "An offering has invalid data.",
            errorType: OFFERING_VALIDATION_CRITICAL_ERROR,
            objectInfo: [
              {
                recordIndex: 0,
                locationCode: csvLocationCodeYESK,
                sabcProgramCode: csvProgramSABCCodeSBC1,
                startDate: "2023-09-05",
                endDate: "2023-10-14",
                offeringStatus: OfferingStatus.CreationPending,
                errors: [],
                infos: [],
                warnings: expect.arrayContaining([
                  expect.objectContaining({
                    typeCode:
                      OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
                    message:
                      "The funded study amount of days is ineligible for StudentAid BC funding. Your offering must be at least 12 weeks of study or longer to be eligible.",
                  }),
                  expect.objectContaining({
                    typeCode:
                      OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
                    message:
                      "Delivery type has an offering delivery that is not allowed by its program.",
                  }),
                ]),
              },
            ],
          });
        });
    },
  );

  it("Should return program related validation error when bulk offering CSV file with a non existing program SABC code is uploaded. ", async () => {
    // Arrange

    const singleOfferingFilePath = path.join(
      __dirname,
      "bulk-insert/single-upload-example1.csv",
    );
    // SABC code from the CSV, that does not exists in the DB.
    const csvProgramSABCCodeSBC3 = "SBC3";

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", singleOfferingFilePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "An offering has invalid data.",
        errorType: OFFERING_VALIDATION_CRITICAL_ERROR,
        objectInfo: [
          {
            recordIndex: 0,
            locationCode: csvLocationCodeYESK,
            sabcProgramCode: csvProgramSABCCodeSBC3,
            startDate: "2023-09-04",
            endDate: "2024-08-13",
            errors: [
              "Not able to find a program related to this offering or it was not provided.",
            ],
            infos: [],
            warnings: [],
          },
        ],
      });
  });

  it(
    "Should return institution location validation errors and delivery method warning " +
      "error when bulk offering CSV file with a non existing location code and program " +
      "with different delivery method is uploaded",
    async () => {
      // Arrange
      // Location code from the CSV, that doesn't exists in DB.
      const csvLocationCodeAESK = "AESK";
      const singleOfferingFilePath = path.join(
        __dirname,
        "bulk-insert/single-upload-example2.csv",
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .attach("file", singleOfferingFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: "An offering has invalid data.",
          errorType: OFFERING_VALIDATION_CRITICAL_ERROR,
          objectInfo: [
            {
              recordIndex: 0,
              locationCode: csvLocationCodeAESK,
              sabcProgramCode: csvProgramSABCCodeSBC1,
              startDate: "2023-09-02",
              endDate: "2024-08-12",
              errors: [
                "Related institution location was not found or was not provided.",
                "Institution location name is required.",
                "Institution operating name is required.",
                "Institution legal operating name is required.",
                "Institution primary email is required.",
              ],
              infos: [],
              warnings: [
                {
                  typeCode:
                    OfferingValidationWarnings.ProgramOfferingDeliveryMismatch,
                  message:
                    "Delivery type has an offering delivery that is not allowed by its program.",
                },
              ],
            },
          ],
        });
    },
  );

  it(
    "Should return validation warnings when bulk offering CSV file with existing location code and SABC " +
      `code with program related costs greater than ${MAX_ALLOWED_OFFERING_AMOUNT} less than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} ` +
      "is uploaded.",
    async () => {
      // Arrange
      const singleOfferingWithMaxExceedingOfferingCost = path.join(
        __dirname,
        "bulk-insert/single-upload-warning-when-max-exceeding-offering-cost.csv",
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(`${endpoint}?validation-only=true`)
        .attach("file", singleOfferingWithMaxExceedingOfferingCost)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: "An offering has invalid data.",
          errorType: OFFERING_VALIDATION_CRITICAL_ERROR,
          objectInfo: [
            {
              recordIndex: 0,
              locationCode: csvLocationCodeYESK,
              sabcProgramCode: csvProgramSABCCodeSBC9,
              startDate: "2023-09-02",
              endDate: "2024-08-12",
              offeringStatus: OfferingStatus.CreationPending,
              errors: [],
              infos: [],
              warnings: [
                {
                  typeCode:
                    OfferingValidationWarnings.OfferingCostExceedMaximum,
                  message:
                    "Program related costs must be not greater than 100000.",
                },
              ],
            },
          ],
        });
    },
  );

  it(
    "Should return validation error when bulk offering CSV file with existing location code and SABC " +
      `code with mandatory fees greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is uploaded.`,
    async () => {
      // Arrange
      const singleOfferingErrorWhenOfferingCostExceedMax = path.join(
        __dirname,
        "bulk-insert/single-upload-error-when-offering-cost-exceed-max.csv",
      );
      // Act/Assert
      await request(app.getHttpServer())
        .post(`${endpoint}?validation-only=true`)
        .attach("file", singleOfferingErrorWhenOfferingCostExceedMax)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          message: "An offering has invalid data.",
          errorType: OFFERING_VALIDATION_CRITICAL_ERROR,
          objectInfo: [
            {
              recordIndex: 0,
              locationCode: csvLocationCodeYESK,
              sabcProgramCode: csvProgramSABCCodeSBC9,
              startDate: "2023-09-02",
              endDate: "2024-08-12",
              errors: [
                `Mandatory fees must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}.`,
              ],
              infos: [],
              warnings: [
                {
                  typeCode:
                    OfferingValidationWarnings.OfferingCostExceedMaximum,
                  message: "Mandatory fees must be not greater than 100000.",
                },
              ],
            },
          ],
        });
    },
  );

  it("Should validate duplication error when there are 2 records with the same name, year of study, start date and end date.", async () => {
    // Arrange
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocationYESK,
    );

    const multipleOfferingWithDuplicateValidationErrorsFilePath = path.join(
      __dirname,
      "bulk-insert/multiple-upload-with-duplicate-offering-validation-errors.csv",
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .attach("file", multipleOfferingWithDuplicateValidationErrorsFilePath)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "Some error happen with one or more offerings being created and the entire process was aborted. No offering was added and the upload can be executed again once the error is fixed.",
        errorType: "OFFERING_CREATION_CRITICAL_ERROR",
        objectInfo: [
          {
            recordIndex: 1,
            locationCode: "YESK",
            sabcProgramCode: "SBC1",
            startDate: "2023-09-06",
            endDate: "2024-08-15",
            errors: [
              "Duplication error. An offering with the same name, year of study, start date and end date was found. Please remove the duplicate offering and try again.",
            ],
            infos: [],
            warnings: [],
          },
        ],
      });
  });

  it(
    `Should create offerings with offering status ${OfferingStatus.CreationPending} when a multi line bulk offering CSV file with` +
      " existing location code and SABC code, and total funded weeks less than minimum allowed weeks where one program offering" +
      " without study breaks and another with study breaks is uploaded.",
    async () => {
      // Arrange
      // Second location code in the multiple CSV.
      const csvLocationCodeSEYK = "SEYK";
      // SABC code in the second row of the multiple CSV.
      const csvProgramSABCCodeSBC4 = "SBC4";

      // Creating an institution location with same location code as that of the
      // second row in the CSV file.
      const collegeFLocationSEYk = createFakeInstitutionLocation(
        {
          institution: collegeF,
        },
        {
          initialValue: {
            institutionCode: csvLocationCodeSEYK,
          } as Partial<InstitutionLocation>,
        },
      );
      // Create a program for the institution with the same SABC code as that of the
      // second row of the multiple CSV file.
      // Setting deliveredOnSite as true, as that of the CSV, so that it will create an approved offering.
      const educationProgramSBC4 = createFakeEducationProgram(
        { institution: collegeF, user: collegeFUser },
        {
          initialValue: {
            sabcCode: csvProgramSABCCodeSBC4,
            deliveredOnSite: true,
          } as Partial<EducationProgram>,
        },
      );

      await db.educationProgram.save(educationProgramSBC4);

      await authorizeUserTokenForLocation(
        db.dataSource,
        InstitutionTokenTypes.CollegeFUser,
        collegeFLocationSEYk,
      );

      const multipleOfferingFilePath = path.join(
        __dirname,
        "bulk-insert/multiple-upload-with-total-funded-weeks-less-than-minimum-allowed-weeks.csv",
      );

      let responseOfferingSBC1: EducationProgram,
        responseOfferingSBC2: EducationProgram;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .attach("file", multipleOfferingFilePath)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .expect((response) => {
          [responseOfferingSBC1, responseOfferingSBC2] = response.body;
          expect(responseOfferingSBC1).toHaveProperty("id");
          expect(responseOfferingSBC2).toHaveProperty("id");
        });

      // Checking the created offering statuses.
      const [offeringSBC1, offeringSBC2] =
        await db.educationProgramOffering.find({
          select: {
            offeringStatus: true,
            name: true,
            studyStartDate: true,
            studyEndDate: true,
            studyBreaks: true as unknown,
          },
          where: {
            id: In([responseOfferingSBC1.id, responseOfferingSBC2.id]),
          },
          order: {
            name: "ASC",
          },
        });

      // The total funded weeks for the programs 'SBC4' in the CSV are less than the minimum allowed weeks,
      // offering status with 'Creation pending' will be created when inserted.
      expect(offeringSBC1).toEqual({
        name: "Test program 41",
        offeringStatus: OfferingStatus.CreationPending,
        studyStartDate: "2024-05-23",
        studyEndDate: "2024-08-07",
        studyBreaks: {
          totalDays: 77,
          totalFundedWeeks: 11,
          fundedStudyPeriodDays: 77,
          unfundedStudyPeriodDays: 0,
        },
      });
      expect(offeringSBC2).toEqual({
        name: "Test program 42",
        offeringStatus: OfferingStatus.CreationPending,
        studyStartDate: "2024-05-23",
        studyEndDate: "2024-08-16",
        studyBreaks: {
          totalDays: 86,
          totalFundedWeeks: 11,
          fundedStudyPeriodDays: 75.6,
          unfundedStudyPeriodDays: 10.4,
          studyBreaks: [
            {
              breakDays: 19,
              breakStartDate: "2024-07-29",
              breakEndDate: "2024-08-16",
              eligibleBreakDays: 19,
              ineligibleBreakDays: 0,
            },
          ],
        },
      });
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
