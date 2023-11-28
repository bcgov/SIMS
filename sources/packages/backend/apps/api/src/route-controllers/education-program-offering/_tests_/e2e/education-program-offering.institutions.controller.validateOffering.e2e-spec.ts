import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  Institution,
  InstitutionLocation,
  OfferingIntensity,
  OfferingStatus,
  OfferingTypes,
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
import { OfferingValidationWarnings } from "../../../../services";
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
  let collegeFEducationProgram: EducationProgram;

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
    const fakeEducationProgram = createFakeEducationProgram({
      institution: collegeF,
      user: collegeFUser,
    });
    fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
    fakeEducationProgram.deliveredOnline = true;
    collegeFEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
  });

  it("Should validate an offering when passed valid data.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFEducationProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation",
      yearOfStudy: 1,
      showYearOfStudy: true,
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
          fundedStudyPeriodDays: 304,
          totalDays: 304,
          totalFundedWeeks: 44,
          unfundedStudyPeriodDays: 0,
        },
      });
  });

  it(
    `Should validate an offering with offering status ${OfferingStatus.CreationPending} and warning when data with actualTuitionCosts ` +
      `greater than ${MAX_ALLOWED_OFFERING_AMOUNT} less than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed.`,
    async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFEducationProgram.id}/validation`;
      const payload = {
        offeringName: "Offering validation test 1",
        yearOfStudy: 1,
        showYearOfStudy: true,
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

  it(`Should return error and warning when data with programRelatedCosts greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed.`, async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${collegeFEducationProgram.id}/validation`;
    const payload = {
      offeringName: "Offering validation test 2",
      yearOfStudy: 1,
      showYearOfStudy: true,
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
      programRelatedCosts: 1000000,
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
        errors: ["Program related costs must be not greater than 999999."],
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

  afterAll(async () => {
    await app?.close();
  });
});
