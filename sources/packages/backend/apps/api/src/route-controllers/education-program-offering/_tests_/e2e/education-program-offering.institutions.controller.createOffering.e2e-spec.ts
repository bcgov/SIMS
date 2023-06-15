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
} from "../../../../testHelpers";
import * as request from "supertest";
import * as faker from "faker";

describe("EducationProgramOfferingInstitutionsController(e2e)-createOffering", () => {
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
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
  });

  it("Should create a new offering when passed valid data.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const fakeEducationProgram = createFakeEducationProgram(
      collegeF,
      collegeFUser,
    );
    fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
      breakDays: 32,
      eligibleBreakDays: 21,
      ineligibleBreakDays: 11,
    };
    const payload = {
      offeringName: "Offering 1",
      yearOfStudy: 1,
      showYearOfStudy: true,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Onsite,
      hasOfferingWILComponent: "no",
      studyStartDate: "2023-09-01",
      studyEndDate: "2024-06-30",
      lacksStudyBreaks: false,
      studyBreaks: [studyBreak],
      studyBreaksOverlappingDetection: false,
      studyPeriodBreakdown: {
        totalDays: 304,
        totalFundedWeeks: 42,
        fundedStudyPeriodDays: 293,
        unfundedStudyPeriodDays: 11,
      },
      offeringType: OfferingTypes.Public,
      offeringDeclaration: true,
      validationWarnings: [],
      validationInfos: ["invalidStudyBreakAmountOfDays"],
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
        showYearOfStudy: payload.showYearOfStudy,
        hasOfferingWILComponent: payload.hasOfferingWILComponent,
        offeringWILType: null,
        studyBreaks: {
          totalDays: payload.studyPeriodBreakdown.totalDays,
          studyBreaks: [studyBreak],
          totalFundedWeeks: payload.studyPeriodBreakdown.totalFundedWeeks,
          fundedStudyPeriodDays:
            payload.studyPeriodBreakdown.fundedStudyPeriodDays,
          unfundedStudyPeriodDays:
            payload.studyPeriodBreakdown.unfundedStudyPeriodDays,
        },
        offeringDeclaration: payload.offeringDeclaration,
        assessedDate: null,
        offeringStatus: OfferingStatus.CreationPending,
        courseLoad: null,
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
