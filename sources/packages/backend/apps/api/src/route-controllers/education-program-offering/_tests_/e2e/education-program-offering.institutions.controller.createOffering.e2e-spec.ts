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
  getAuthorizedLocation,
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
import {
  OfferingYesNoOptions,
  OnlineInstructionModeOptions,
} from "../../../../services";
import { getISODateOnlyString } from "@sims/utilities";
import { InstitutionUserTypes } from "../../../../auth";

describe("EducationProgramOfferingInstitutionsController(e2e)-createOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let studyPeriodBreakdown: Omit<StudyBreaksAndWeeksOutDTO, "studyBreaks">;
  let payload: Partial<EducationProgramOfferingAPIInDTO>;
  let studyBreak: StudyBreakAPIOutDTO;
  // BC Private institution.
  let institutionCollegeC: Institution;
  let collegeCLocation: InstitutionLocation;
  let institutionCollegeCUser: User;
  // Out of province institution.
  let institutionCollegeD: Institution;
  let collegeDLocation: InstitutionLocation;
  let institutionCollegeDUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user: institutionUser } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    // Get BC Private institution and institution user.
    const { institution: collegeC, user: collegeCUser } =
      await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeCUser,
      );
    // Get out of province institution and institution user.
    const { institution: collegeD, user: collegeDUser } =
      await getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeDUser,
      );
    institutionCollegeC = collegeC;
    institutionCollegeCUser = collegeCUser;
    institutionCollegeD = collegeD;
    institutionCollegeDUser = collegeDUser;
    collegeF = institution;
    collegeFUser = institutionUser;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    collegeCLocation = createFakeInstitutionLocation({
      institution: institutionCollegeC,
    });
    collegeDLocation = createFakeInstitutionLocation({
      institution: institutionCollegeD,
    });
    const authorizeCollegeFPromise = authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    const authorizeCollegeCPromise = authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeCUser,
      collegeCLocation,
    );
    const authorizeCollegeDPromise = authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeDUser,
      collegeDLocation,
    );
    await Promise.all([
      authorizeCollegeFPromise,
      authorizeCollegeCPromise,
      authorizeCollegeDPromise,
    ]);
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
      hasOfferingWILComponent: OfferingYesNoOptions.No,
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
        select: {
          name: true,
          studyStartDate: true,
          studyEndDate: true,
          actualTuitionCosts: true,
          programRelatedCosts: true,
          mandatoryFees: true,
          exceptionalExpenses: true,
          offeringDelivered: true,
          lacksStudyBreaks: true,
          offeringType: true,
          offeringIntensity: true,
          yearOfStudy: true,
          hasOfferingWILComponent: true,
          studyBreaks: true as unknown,
          offeringDeclaration: true,
          offeringStatus: true,
        },
        where: { id: educationProgramOfferingId },
      });
    expect(createdEducationProgramOffering).toEqual({
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
      offeringStatus: OfferingStatus.CreationPending,
    });
  });

  it(
    "Should create a new offering for a BC Public institution when the offering delivery is online" +
      " and mode of online instruction is provided.",
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
      const payload: Partial<EducationProgramOfferingAPIInDTO> = {
        offeringName: "Offering 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Online,
        hasOfferingWILComponent: OfferingYesNoOptions.No,
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
        onlineInstructionMode: OnlineInstructionModeOptions.SynchronousOnly,
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
          select: {
            name: true,
            studyStartDate: true,
            studyEndDate: true,
            actualTuitionCosts: true,
            programRelatedCosts: true,
            mandatoryFees: true,
            exceptionalExpenses: true,
            offeringDelivered: true,
            lacksStudyBreaks: true,
            offeringType: true,
            offeringIntensity: true,
            yearOfStudy: true,
            hasOfferingWILComponent: true,
            studyBreaks: true as unknown,
            offeringDeclaration: true,
            offeringStatus: true,
            onlineInstructionMode: true,
          },
          where: { id: educationProgramOfferingId },
        });
      expect(createdEducationProgramOffering).toEqual({
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
        offeringStatus: OfferingStatus.CreationPending,
        onlineInstructionMode: payload.onlineInstructionMode,
      });
    },
  );

  it(
    "Should throw bad request error when trying to create offering for a BC Public institution when the offering delivery is onsite" +
      " and mode of online instruction is provided which is not allowed.",
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
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
      const studyBreak = {
        breakStartDate: "2023-12-01",
        breakEndDate: "2024-01-01",
      };

      const payload: Partial<EducationProgramOfferingAPIInDTO> = {
        offeringName: "Offering 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Onsite,
        hasOfferingWILComponent: OfferingYesNoOptions.No,
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
        onlineInstructionMode: OnlineInstructionModeOptions.SynchronousOnly,
      };

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          statusCode: HttpStatus.BAD_REQUEST,
          message: [
            "Online instruction mode is not allowed for provided institution type or offering delivery type and offering online delivery inputs.",
          ],
          error: "The validated offerings have critical errors.",
        });
    },
  );

  it("Should create a new offering for a BC Private institution when the offering delivery is online.", async () => {
    // Arrange
    // College C is a BC Private institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const fakeEducationProgram = createFakeEducationProgram({
      institution: institutionCollegeC,
      user: institutionCollegeCUser,
    });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeCLocation.id}/education-program/${savedFakeEducationProgram.id}`;
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
    const payload: Partial<EducationProgramOfferingAPIInDTO> = {
      offeringName: "Offering 1",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: OfferingYesNoOptions.No,
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
      onlineInstructionMode: OnlineInstructionModeOptions.SynchronousOnly,
    };

    // Act/Assert
    let educationProgramOfferingId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramOfferingId = response.body.id;
      });
    const createdEducationProgramOffering =
      await db.educationProgramOffering.findOne({
        select: {
          name: true,
          studyStartDate: true,
          studyEndDate: true,
          actualTuitionCosts: true,
          programRelatedCosts: true,
          mandatoryFees: true,
          exceptionalExpenses: true,
          offeringDelivered: true,
          lacksStudyBreaks: true,
          offeringType: true,
          offeringIntensity: true,
          yearOfStudy: true,
          hasOfferingWILComponent: true,
          studyBreaks: true as unknown,
          offeringDeclaration: true,
          offeringStatus: true,
          onlineInstructionMode: true,
        },
        where: { id: educationProgramOfferingId },
      });
    expect(createdEducationProgramOffering).toEqual({
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
      offeringStatus: OfferingStatus.CreationPending,
      onlineInstructionMode: payload.onlineInstructionMode,
    });
  });

  it(
    "Should create a new offering for a BC Private institution when the offering delivery is blended" +
      " and percentage of online duration is always the same.",
    async () => {
      // Arrange
      // College C is a BC Private institution.
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeCUser,
      );
      const fakeEducationProgram = createFakeEducationProgram({
        institution: institutionCollegeC,
        user: institutionCollegeCUser,
      });
      const savedFakeEducationProgram = await db.educationProgram.save(
        fakeEducationProgram,
      );
      const endpoint = `/institutions/education-program-offering/location/${collegeCLocation.id}/education-program/${savedFakeEducationProgram.id}`;
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
      const payload: Partial<EducationProgramOfferingAPIInDTO> = {
        offeringName: "Offering 1",
        yearOfStudy: 1,
        offeringIntensity: OfferingIntensity.fullTime,
        offeringDelivered: OfferingDeliveryOptions.Blended,
        hasOfferingWILComponent: OfferingYesNoOptions.No,
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
        onlineInstructionMode: OnlineInstructionModeOptions.SynchronousOnly,
        isOnlineDurationSameAlways: OfferingYesNoOptions.Yes,
        totalOnlineDuration: 45,
      };

      // Act/Assert
      let educationProgramOfferingId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .then((response) => {
          expect(response.body.id).toBeGreaterThan(0);
          educationProgramOfferingId = response.body.id;
        });
      const createdEducationProgramOffering =
        await db.educationProgramOffering.findOne({
          select: {
            name: true,
            studyStartDate: true,
            studyEndDate: true,
            actualTuitionCosts: true,
            programRelatedCosts: true,
            mandatoryFees: true,
            exceptionalExpenses: true,
            offeringDelivered: true,
            lacksStudyBreaks: true,
            offeringType: true,
            offeringIntensity: true,
            yearOfStudy: true,
            hasOfferingWILComponent: true,
            studyBreaks: true as unknown,
            offeringDeclaration: true,
            offeringStatus: true,
            onlineInstructionMode: true,
            isOnlineDurationSameAlways: true,
            totalOnlineDuration: true,
          },
          where: { id: educationProgramOfferingId },
        });
      expect(createdEducationProgramOffering).toEqual({
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
        offeringStatus: OfferingStatus.CreationPending,
        onlineInstructionMode: payload.onlineInstructionMode,
        isOnlineDurationSameAlways: payload.isOnlineDurationSameAlways,
        totalOnlineDuration: payload.totalOnlineDuration,
      });
    },
  );

  it("Should throw bad request error when trying to create offering for a BC Private institution when the offering delivery is online and mode of online instruction is not provided.", async () => {
    // Arrange
    // College C is a BC Private institution.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCUser,
    );
    const fakeEducationProgram = createFakeEducationProgram({
      institution: institutionCollegeC,
      user: institutionCollegeCUser,
    });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeCLocation.id}/education-program/${savedFakeEducationProgram.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
    };
    const payload: Partial<EducationProgramOfferingAPIInDTO> = {
      offeringName: "Offering 1",
      yearOfStudy: 1,
      offeringIntensity: OfferingIntensity.fullTime,
      offeringDelivered: OfferingDeliveryOptions.Online,
      hasOfferingWILComponent: OfferingYesNoOptions.No,
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
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          `Online instruction mode must be one of the following options: ${Object.values(
            OnlineInstructionModeOptions,
          ).join(",")}`,
        ],
        error: "The validated offerings have critical errors.",
      });
  });

  it("Should create new offering when the institution type is out of province and the offering delivery is online.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeDUser,
    );
    const fakeEducationProgram = createFakeEducationProgram({
      institution: institutionCollegeD,
      user: institutionCollegeDUser,
    });
    fakeEducationProgram.sabcCode = faker.random.alpha({ count: 4 });
    const savedFakeEducationProgram = await db.educationProgram.save(
      fakeEducationProgram,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeDLocation.id}/education-program/${savedFakeEducationProgram.id}`;
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
      offeringDelivered: OfferingDeliveryOptions.Online,
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
        select: {
          name: true,
          studyStartDate: true,
          studyEndDate: true,
          actualTuitionCosts: true,
          programRelatedCosts: true,
          mandatoryFees: true,
          exceptionalExpenses: true,
          offeringDelivered: true,
          lacksStudyBreaks: true,
          offeringType: true,
          offeringIntensity: true,
          yearOfStudy: true,
          hasOfferingWILComponent: true,
          studyBreaks: true as unknown,
          offeringDeclaration: true,
          offeringStatus: true,
        },
        where: { id: educationProgramOfferingId },
      });
    expect(createdEducationProgramOffering).toEqual({
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
      offeringStatus: OfferingStatus.CreationPending,
    });
  });

  it("Should not create a new offering when user is read-only.", async () => {
    // Arrange
    const collegeELocation = await getAuthorizedLocation(
      db,
      InstitutionTokenTypes.CollegeEReadOnlyUser,
      InstitutionUserTypes.readOnlyUser,
    );
    const endpoint = `/institutions/education-program-offering/location/${collegeELocation.id}/education-program/999999`;
    const collegEInstitutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
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
    const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
    const studyBreak = {
      breakStartDate: "2023-12-01",
      breakEndDate: "2024-01-01",
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
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "The education program is expired.",
        error: "EDUCATION_PROGRAM_IS_EXPIRED",
      });
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
        onlineInstructionMode: null,
        isOnlineDurationSameAlways: null,
        totalOnlineDuration: null,
        minimumOnlineDuration: null,
        maximumOnlineDuration: null,
      });
    },
  );

  it(
    `Should create a new full-time offering with offering status ${OfferingStatus.CreationPending} and warning when data with total funded ` +
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
      const endpoint = `/institutions/education-program-offering/location/${collegeFLocation.id}/education-program/${savedFakeEducationProgram.id}`;
      payload.studyStartDate = "2024-05-23";
      payload.studyEndDate = "2024-05-24";
      payload.lacksStudyBreaks = true;
      payload.studyBreaks = [];

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
          totalDays: 2,
          studyBreaks: [],
          totalFundedWeeks: 1,
          fundedStudyPeriodDays: 2,
          unfundedStudyPeriodDays: 0,
        },
        offeringDeclaration: payload.offeringDeclaration,
        assessedDate: null,
        offeringStatus: OfferingStatus.CreationPending,
        submittedDate: expect.any(Date),
        courseLoad: null,
        onlineInstructionMode: null,
        isOnlineDurationSameAlways: null,
        totalOnlineDuration: null,
        minimumOnlineDuration: null,
        maximumOnlineDuration: null,
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
    payload.mandatoryFees = MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE + 1;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: [
          `Mandatory fees must be not greater than ${MONEY_VALUE_FOR_UNKNOWN_MAX_VALUE}.`,
        ],
        error: "The validated offerings have critical errors.",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
