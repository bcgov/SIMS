import { HttpStatus, INestApplication } from "@nestjs/common";
import {
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
  createFakeEducationProgramOffering,
  getReadOnlyAuthorizedLocation,
} from "../../../../testHelpers";
import * as request from "supertest";
import * as faker from "faker";
import {
  MAX_ALLOWED_OFFERING_AMOUNT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
} from "../../../../utilities";
import { getISODateOnlyString } from "@sims/utilities";

describe("EducationProgramOfferingInstitutionsController(e2e)-updateProgramOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;

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
  });

  it("Should update a new offering when passed valid data.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const fakeEducationProgram = createFakeEducationProgram({
      institution: collegeF,
      user: collegeFUser,
    });
    fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const newOffering = createFakeEducationProgramOffering(
      savedFakeEducationProgram,
      collegeFLocation,
    );
    newOffering.parentOffering = newOffering;
    const savedEducationProgramOffering =
      await db.educationProgramOffering.save(newOffering);

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
    };
    const studyPeriodBreakdown = {
      totalDays: 304,
      totalFundedWeeks: 42,
      fundedStudyPeriodDays: 293,
      unfundedStudyPeriodDays: 11,
    };
    const payload = {
      offeringName: "Updated offering name",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2023-09-01",
      studyEndDate: "2024-06-30",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
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
      .patch(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});
    const updatedEducationProgramOffering =
      await db.educationProgramOffering.findOne({
        where: { id: savedEducationProgramOffering.id },
      });
    expect(updatedEducationProgramOffering).toEqual(
      expect.objectContaining({
        name: payload.offeringName,
        studyStartDate: payload.studyStartDate,
        studyEndDate: payload.studyEndDate,
        actualTuitionCosts: payload.actualTuitionCosts,
        programRelatedCosts: payload.programRelatedCosts,
        mandatoryFees: payload.mandatoryFees,
        exceptionalExpenses: payload.exceptionalExpenses,
        offeringDelivered: payload.offeringDelivered,
        lacksStudyBreaks: payload.lacksStudyBreaks,
        offeringType: payload.offeringType,
        offeringIntensity: payload.offeringIntensity,
        yearOfStudy: payload.yearOfStudy,
        hasOfferingWILComponent: payload.hasOfferingWILComponent,
        offeringWILType: null,
        studyBreaks: {
          totalDays: studyPeriodBreakdown.totalDays,
          studyBreaks: [
            {
              breakStartDate: studyBreak.breakStartDate,
              breakEndDate: studyBreak.breakEndDate,
              breakDays: 32,
              eligibleBreakDays: 21,
              ineligibleBreakDays: 11,
            },
          ],
          totalFundedWeeks: studyPeriodBreakdown.totalFundedWeeks,
          fundedStudyPeriodDays: studyPeriodBreakdown.fundedStudyPeriodDays,
          unfundedStudyPeriodDays: studyPeriodBreakdown.unfundedStudyPeriodDays,
        },
        offeringDeclaration: payload.offeringDeclaration,
        assessedDate: null,
        offeringStatus: OfferingStatus.CreationPending,
      }),
    );
  });

  it("Should not update a new offering when requested by a read-only user.", async () => {
    // Arrange
    const collegeELocation = await getReadOnlyAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeELocation.id}/education-program/999999/offering/999999`;
    const collegEInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .auth(collegEInstitutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "Forbidden resource",
        error: "Forbidden",
      });
  });

  it("Should throw error when education program is expired.", async () => {
    // Arrange
    const fakeEducationProgram = createFakeEducationProgram(
      {
        institution: collegeF,
        user: collegeFUser,
      },
      {
        initialValue: {
          effectiveEndDate: getISODateOnlyString(new Date()),
        },
      },
    );
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const newOffering = createFakeEducationProgramOffering(
      savedFakeEducationProgram,
      collegeFLocation,
    );
    newOffering.parentOffering = newOffering;
    const savedEducationProgramOffering =
      await db.educationProgramOffering.save(newOffering);

    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
    };
    const payload = {
      offeringName: "Updated offering name",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2023-09-01",
      studyEndDate: "2024-06-30",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "Program is expired and the offering cannot be updated.",
        error: "Unprocessable Entity",
      });
  });

  it(
    "Should validate the offering update as duplicate when offering with the same " +
      "name, year of study, study dates and status already exists in the database.",
    async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const fakeEducationProgram = createFakeEducationProgram({
        institution: collegeF,
        user: collegeFUser,
      });
      fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
      const savedFakeEducationProgram = await db.educationProgram.save(
        fakeEducationProgram,
      );
      const newOffering = createFakeEducationProgramOffering(
        savedFakeEducationProgram,
        collegeFLocation,
      );
      newOffering.parentOffering = newOffering;
      newOffering.studyStartDate = "2023-11-01";
      newOffering.studyEndDate = "2024-06-01";
      newOffering.offeringStatus = OfferingStatus.CreationPending;

      const savedEducationProgramOffering =
        await db.educationProgramOffering.save(newOffering);

      const savedEducationProgramOffering2 =
        await db.educationProgramOffering.save({
          ...newOffering,
          id: null,
          name: newOffering.name + 2,
        });

      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering2.id}`;

      const payload = {
        offeringName: savedEducationProgramOffering.name,
        yearOfStudy: savedEducationProgramOffering.yearOfStudy,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Onsite,
        hasOfferingWILComponent: "no",
        studyStartDate: savedEducationProgramOffering.studyStartDate,
        studyEndDate: savedEducationProgramOffering.studyEndDate,
        lacksStudyBreaks: false,
        studyBreaks: [
          {
            breakStartDate: "2023-12-01",
            breakEndDate: "2024-01-01",
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
        .patch(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message:
            "Duplication error. An offering with the same name, year of study, start date and end date was found.",
          error: "Unprocessable Entity",
        });
    },
  );

  it(
    `Should update a new offering with offering status ${OfferingStatus.CreationPending} and warning when data with mandatoryFees ` +
      `greater than ${MAX_ALLOWED_OFFERING_AMOUNT} less than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed.`,
    async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const fakeEducationProgram = createFakeEducationProgram({
        institution: collegeF,
        user: collegeFUser,
      });
      fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
      const savedFakeEducationProgram = await db.educationProgram.save(
        fakeEducationProgram,
      );
      const newOffering = createFakeEducationProgramOffering(
        savedFakeEducationProgram,
        collegeFLocation,
      );

      newOffering.parentOffering = newOffering;
      const savedEducationProgramOffering =
        await db.educationProgramOffering.save(newOffering);
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering.id}`;
      const studyBreak = {
        breakStartDate: "2023-12-01",
        breakEndDate: "2024-01-01",
      };
      const studyPeriodBreakdown = {
        totalDays: 304,
        totalFundedWeeks: 42,
        fundedStudyPeriodDays: 293,
        unfundedStudyPeriodDays: 11,
      };
      const payload = {
        offeringName: "Updated offering name test 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Onsite,
        hasOfferingWILComponent: "no",
        studyStartDate: "2023-09-01",
        studyEndDate: "2024-06-30",
        lacksStudyBreaks: false,
        studyBreaks: [
          {
            breakStartDate: studyBreak.breakStartDate,
            breakEndDate: studyBreak.breakEndDate,
          },
        ],
        offeringType: OfferingTypes.Public,
        offeringDeclaration: true,
        actualTuitionCosts: 1234,
        programRelatedCosts: 3211,
        mandatoryFees: 100001,
        exceptionalExpenses: 555,
      };

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});
      const updatedEducationProgramOffering =
        await db.educationProgramOffering.findOne({
          where: { id: savedEducationProgramOffering.id },
        });
      expect(updatedEducationProgramOffering).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        id: expect.any(Number),
        name: payload.offeringName,
        studyStartDate: payload.studyStartDate,
        studyEndDate: payload.studyEndDate,
        actualTuitionCosts: payload.actualTuitionCosts,
        programRelatedCosts: payload.programRelatedCosts,
        mandatoryFees: payload.mandatoryFees,
        exceptionalExpenses: payload.exceptionalExpenses,
        offeringDelivered: payload.offeringDelivered,
        lacksStudyBreaks: payload.lacksStudyBreaks,
        offeringType: payload.offeringType,
        offeringIntensity: payload.offeringIntensity,
        yearOfStudy: payload.yearOfStudy,
        hasOfferingWILComponent: payload.hasOfferingWILComponent,
        offeringWILType: null,
        studyBreaks: {
          totalDays: studyPeriodBreakdown.totalDays,
          studyBreaks: [
            {
              breakStartDate: studyBreak.breakStartDate,
              breakEndDate: studyBreak.breakEndDate,
              breakDays: 32,
              eligibleBreakDays: 21,
              ineligibleBreakDays: 11,
            },
          ],
          totalFundedWeeks: studyPeriodBreakdown.totalFundedWeeks,
          fundedStudyPeriodDays: studyPeriodBreakdown.fundedStudyPeriodDays,
          unfundedStudyPeriodDays: studyPeriodBreakdown.unfundedStudyPeriodDays,
        },
        offeringDeclaration: payload.offeringDeclaration,
        assessedDate: null,
        offeringStatus: OfferingStatus.CreationPending,
        submittedDate: expect.any(Date),
        courseLoad: expect.any(Number),
      });
    },
  );

  it(
    `Should update a new offering with offering status ${OfferingStatus.CreationPending} and warning when data with total funded ` +
      `weeks less than minimum allowed weeks and without study breaks is passed.`,
    async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const fakeEducationProgram = createFakeEducationProgram({
        institution: collegeF,
        user: collegeFUser,
      });
      const savedFakeEducationProgram = await db.educationProgram.save(
        fakeEducationProgram,
      );
      const newOffering = createFakeEducationProgramOffering(
        savedFakeEducationProgram,
        collegeFLocation,
      );

      newOffering.parentOffering = newOffering;
      const savedEducationProgramOffering =
        await db.educationProgramOffering.save(newOffering);
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering.id}`;
      const studyPeriodBreakdown = {
        totalDays: 2,
        totalFundedWeeks: 1,
        fundedStudyPeriodDays: 2,
        unfundedStudyPeriodDays: 0,
      };
      const payload = {
        offeringName: "Updated offering name test 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Onsite,
        hasOfferingWILComponent: "no",
        studyStartDate: "2023-09-01",
        studyEndDate: "2023-09-02",
        lacksStudyBreaks: true,
        studyBreaks: [],
        offeringType: OfferingTypes.Public,
        offeringDeclaration: true,
        actualTuitionCosts: 1234,
        programRelatedCosts: 3211,
        mandatoryFees: 100001,
        exceptionalExpenses: 555,
      };

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});
      const updatedEducationProgramOffering =
        await db.educationProgramOffering.findOne({
          where: { id: savedEducationProgramOffering.id },
        });
      expect(updatedEducationProgramOffering).toEqual({
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        id: expect.any(Number),
        name: payload.offeringName,
        studyStartDate: payload.studyStartDate,
        studyEndDate: payload.studyEndDate,
        actualTuitionCosts: payload.actualTuitionCosts,
        programRelatedCosts: payload.programRelatedCosts,
        mandatoryFees: payload.mandatoryFees,
        exceptionalExpenses: payload.exceptionalExpenses,
        offeringDelivered: payload.offeringDelivered,
        lacksStudyBreaks: payload.lacksStudyBreaks,
        offeringType: payload.offeringType,
        offeringIntensity: payload.offeringIntensity,
        yearOfStudy: payload.yearOfStudy,
        hasOfferingWILComponent: payload.hasOfferingWILComponent,
        offeringWILType: null,
        studyBreaks: {
          totalDays: studyPeriodBreakdown.totalDays,
          studyBreaks: [],
          totalFundedWeeks: studyPeriodBreakdown.totalFundedWeeks,
          fundedStudyPeriodDays: studyPeriodBreakdown.fundedStudyPeriodDays,
          unfundedStudyPeriodDays: studyPeriodBreakdown.unfundedStudyPeriodDays,
        },
        offeringDeclaration: payload.offeringDeclaration,
        assessedDate: null,
        offeringStatus: OfferingStatus.CreationPending,
        submittedDate: expect.any(Date),
        courseLoad: expect.any(Number),
      });
    },
  );

  it(`Should return error when trying to update a new offering with exceptionalExpenses greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed.`, async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const fakeEducationProgram = createFakeEducationProgram({
      institution: collegeF,
      user: collegeFUser,
    });
    fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const newOffering = createFakeEducationProgramOffering(
      savedFakeEducationProgram,
      collegeFLocation,
    );

    newOffering.parentOffering = newOffering;
    const savedEducationProgramOffering =
      await db.educationProgramOffering.save(newOffering);
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}/offering/${savedEducationProgramOffering.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
    };

    const payload = {
      offeringName: "Updated offering name test 2",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2023-09-01",
      studyEndDate: "2024-06-30",
      lacksStudyBreaks: false,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
        },
      ],
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      actualTuitionCosts: 1234,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE + 1,
    };

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          `Exceptional expenses must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}.`,
        ],
        error: "The validated offerings have critical errors.",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
