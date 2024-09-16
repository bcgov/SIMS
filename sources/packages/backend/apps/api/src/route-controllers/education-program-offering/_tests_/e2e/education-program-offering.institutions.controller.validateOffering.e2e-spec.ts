import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
  ProgramIntensity,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  OfferingDeliveryOptions,
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
import * as faker from "faker";
import {
  OfferingValidationInfos,
  OfferingValidationWarnings,
} from "../../../../services";
import {
  MAX_ALLOWED_OFFERING_AMOUNT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
} from "../../../../utilities";

describe("EducationProgramOfferingInstitutionsController(e2e)-validateOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let collegeFFullTimeProgram: EducationProgram;
  let collegeFPartTimeProgram: EducationProgram;

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
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    const fakeFullTimeEducationProgram = createFakeEducationProgram(
      {
        institution: collegeF,
        user: collegeFUser,
      },
      {
        initialValue: {
          sabcCode: faker.random.alpha({ count: 4 }),
          deliveredOnline: true,
        },
      },
    );
    const fakePartTimeEducationProgram = createFakeEducationProgram(
      {
        institution: collegeF,
        user: collegeFUser,
      },
      {
        initialValue: {
          programIntensity: ProgramIntensity.fullTimePartTime,
          deliveredOnSite: true,
        },
      },
    );
    collegeFFullTimeProgram = await db.educationProgram.save(
      fakeFullTimeEducationProgram,
    );
    collegeFPartTimeProgram = await db.educationProgram.save(
      fakePartTimeEducationProgram,
    );
  });

  it(
    `Should validate an offering with offering status ${OfferingStatus.CreationPending} and warning when data with actualTuitionCosts ` +
      `greater than ${MAX_ALLOWED_OFFERING_AMOUNT} less than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed in for a full-time program.`,
    async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
      const payload = {
        offeringName: "Offering validation test 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Online,
        hasOfferingWILComponent: "no",
        studyStartDate: "2023-09-01",
        studyEndDate: "2024-06-30",
        lacksStudyBreaks: false,
        studyBreaks: [
          {
            breakStartDate: "2023-12-01",
            breakEndDate: "2023-12-18",
          },
        ],
        offeringType: OfferingTypes.Public,
        offeringDeclaration: true,
        actualTuitionCosts: 100001,
        programRelatedCosts: 3211,
        mandatoryFees: 456,
        exceptionalExpenses: 555,
      };

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          offeringStatus: OfferingStatus.CreationPending,
          errors: [],
          infos: [],
          warnings: [
            {
              typeCode: OfferingValidationWarnings.OfferingCostExceedMaximum,
              message: "Tuition must be not greater than 100000.",
            },
          ],
          studyPeriodBreakdown: {
            fundedStudyPeriodDays: 304,
            totalDays: 304,
            totalFundedWeeks: 44,
            unfundedStudyPeriodDays: 0,
          },
        });
    },
  );

  it(`Should return error and warning when data with programRelatedCosts greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed in for a full-time program.`, async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation test 2",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2023-09-01",
      studyEndDate: "2024-06-30",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2023-12-01",
          breakEndDate: "2023-12-18",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 5000,
      programRelatedCosts: MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE + 1,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        errors: [
          `Program related costs must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}.`,
        ],
        infos: [],
        warnings: [
          {
            typeCode: OfferingValidationWarnings.OfferingCostExceedMaximum,
            message: "Program related costs must be not greater than 100000.",
          },
        ],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 304,
          totalDays: 304,
          totalFundedWeeks: 44,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering when valid data without study breaks is passed in for a full-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-05-23",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: true,
      studyBreaks: [],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 86,
          totalDays: 86,
          totalFundedWeeks: 13,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering when valid data with study breaks is passed in for a full-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-01-01",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-08-05",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 229,
          totalDays: 229,
          totalFundedWeeks: 33,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering with info when valid data with study breaks is passed in for a full-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-05-23",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-08-05",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [
          {
            typeCode:
              OfferingValidationInfos.InvalidStudyBreaksCombinedThresholdPercentage,
            message:
              "The combined study breaks exceed the 10% threshold as outlined in StudentAid BC policy.",
          },
        ],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 82.6,
          totalDays: 86,
          totalFundedWeeks: 12,
          unfundedStudyPeriodDays: 3.4,
        },
      });
  });

  it("Should validate an offering with info and warning when data with total funded weeks less than minimum allowed weeks and study breaks is passed in for a full-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-05-23",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-07-29",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: OfferingStatus.CreationPending,
        errors: [],
        infos: [
          {
            typeCode:
              OfferingValidationInfos.InvalidStudyBreaksCombinedThresholdPercentage,
            message:
              "The combined study breaks exceed the 10% threshold as outlined in StudentAid BC policy.",
          },
        ],
        warnings: [
          {
            typeCode: OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
            message:
              "Full-time offerings must be at least 12 funded weeks of study or longer to be eligible. Any shorter offerings can be submitted but will require SABC review.",
          },
        ],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 75.6,
          totalDays: 86,
          totalFundedWeeks: 11,
          unfundedStudyPeriodDays: 10.4,
        },
      });
  });

  it("Should validate an offering with warning when data with total funded weeks less than minimum allowed weeks and without study breaks is passed in for a full-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFFullTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-05-23",
      studyEndDate: "2024-05-24",
      lacksStudyBreaks: true,
      studyBreaks: [],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: OfferingStatus.CreationPending,
        errors: [],
        infos: [],
        warnings: [
          {
            typeCode: OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
            message:
              "Full-time offerings must be at least 12 funded weeks of study or longer to be eligible. Any shorter offerings can be submitted but will require SABC review.",
          },
        ],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 2,
          totalDays: 2,
          totalFundedWeeks: 1,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering when valid data without study breaks is passed in for a part-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFPartTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.partTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-07-01",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: true,
      studyBreaks: [],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
      courseLoad: 50,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 47,
          totalDays: 47,
          totalFundedWeeks: 7,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering when valid data with study breaks is passed in for a part-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFPartTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.partTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-01-01",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-08-05",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
      courseLoad: 30,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 229,
          totalDays: 229,
          totalFundedWeeks: 33,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it("Should validate an offering with info when valid data with study breaks is passed in for a part-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFPartTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.partTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-07-01",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-08-05",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
      courseLoad: 30,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: "Approved",
        errors: [],
        infos: [
          {
            typeCode:
              OfferingValidationInfos.InvalidStudyBreaksCombinedThresholdPercentage,
            message:
              "The combined study breaks exceed the 10% threshold as outlined in StudentAid BC policy.",
          },
        ],
        warnings: [],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 39.7,
          totalDays: 47,
          totalFundedWeeks: 6,
          unfundedStudyPeriodDays: 7.3,
        },
      });
  });

  it("Should validate an offering with info and warning when data with total funded weeks less than minimum allowed weeks and study breaks is passed in for a part-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFPartTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.partTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-07-01",
      studyEndDate: "2024-08-16",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: "2024-07-29",
          breakEndDate: "2024-08-16",
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
      courseLoad: 30,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: OfferingStatus.CreationPending,
        errors: [],
        infos: [
          {
            typeCode:
              OfferingValidationInfos.InvalidStudyBreaksCombinedThresholdPercentage,
            message:
              "The combined study breaks exceed the 10% threshold as outlined in StudentAid BC policy.",
          },
        ],
        warnings: [
          {
            typeCode: OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
            message:
              "Part-time offerings must be at least 6 funded weeks of study or longer to be eligible. Any shorter offerings can be submitted but will require SABC review.",
          },
        ],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 32.7,
          totalDays: 47,
          totalFundedWeeks: 5,
          unfundedStudyPeriodDays: 14.3,
        },
      });
  });

  it("Should validate an offering with warning when data with total funded weeks less than minimum allowed weeks and without study breaks is passed in for a part-time education program offering.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFPartTimeProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.partTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2024-07-01",
      studyEndDate: "2024-07-02",
      lacksStudyBreaks: true,
      studyBreaks: [],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
      courseLoad: 30,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        offeringStatus: OfferingStatus.CreationPending,
        errors: [],
        infos: [],
        warnings: [
          {
            typeCode: OfferingValidationWarnings.InvalidFundedStudyPeriodLength,
            message:
              "Part-time offerings must be at least 6 funded weeks of study or longer to be eligible. Any shorter offerings can be submitted but will require SABC review.",
          },
        ],
        studyPeriodBreakdown: {
          fundedStudyPeriodDays: 2,
          totalDays: 2,
          totalFundedWeeks: 1,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
