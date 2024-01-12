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
} from "../../../../testHelpers";
import * as request from "supertest";
import * as faker from "faker";
import {
  MAX_ALLOWED_OFFERING_AMOUNT,
  MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE,
} from "../../../../utilities";
import {
  EducationProgramOfferingAPIInDTO,
  StudyBreakAPIOutDTO,
  StudyBreaksAndWeeksOutDTO,
} from "../../models/education-program-offering.dto";
import { WILComponentOptions } from "../../../../services";

describe("EducationProgramOfferingInstitutionsController(e2e)-createOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let studyPeriodBreakdown: Omit<StudyBreaksAndWeeksOutDTO, "studyBreaks">;
  let payload: Partial<EducationProgramOfferingAPIInDTO>;
  let studyBreak: StudyBreakAPIOutDTO;

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
    studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
    };
    studyPeriodBreakdown = {
      totalDays: 304,
      totalFundedWeeks: 42,
      fundedStudyPeriodDays: 293,
      unfundedStudyPeriodDays: 11,
    };
    payload = {
      offeringName: "Offering",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: WILComponentOptions.No,
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
      actualTuitionCosts: 100001,
      programRelatedCosts: 3211,
      mandatoryFees: 456,
      exceptionalExpenses: 555,
    };
  });

  it("Should create a new offering when passed valid data.", async () => {
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
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
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
      offeringName: "Offering 1",
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
    let educationProgramOfferingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramOfferingId = response.body.id;
      });
    const createdEducationProgramOffering =
      await db.educationProgramOffering.findOne({
        where: { id: educationProgramOfferingId },
      });
    expect(createdEducationProgramOffering).toEqual(
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
        courseLoad: null,
      }),
    );
  });

  it(
    "Should validate the new offering as duplicate when offering with the same " +
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
      const existingOffering = createFakeEducationProgramOffering(
        savedFakeEducationProgram,
        collegeFLocation,
      );
      existingOffering.parentOffering = existingOffering;
      existingOffering.studyStartDate = "2023-11-01";
      existingOffering.studyEndDate = "2024-06-01";
      existingOffering.offeringStatus = OfferingStatus.CreationPending;

      const savedEducationProgramOffering =
        await db.educationProgramOffering.save(existingOffering);

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
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;

      // Act/Assert
      // Should throw unprocessable entity
      await request(app.getHttpServer())
        .post(endpoint)
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
    `Should create a new offering with offering status ${OfferingStatus.CreationPending} and warning when data with actualTuitionCosts ` +
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
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
      payload.offeringName = "Offering 2";
      payload.actualTuitionCosts = 100001;

      // Act/Assert
      let educationProgramOfferingId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.id).toBeGreaterThan(0);
          educationProgramOfferingId = response.body.id;
        });
      const createdEducationProgramOffering =
        await db.educationProgramOffering.findOne({
          where: { id: educationProgramOfferingId },
        });

      expect(createdEducationProgramOffering).toEqual({
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
        courseLoad: null,
      });
    },
  );

  it(`Should return error when trying to create a new offering with mandatoryFees greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE} is passed.`, async () => {
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
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
    payload.offeringName = "Offering 3";
    payload.mandatoryFees = 1000000;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: ["Mandatory fees must be not greater than 999999."],
        error: "The validated offerings have critical errors.",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
