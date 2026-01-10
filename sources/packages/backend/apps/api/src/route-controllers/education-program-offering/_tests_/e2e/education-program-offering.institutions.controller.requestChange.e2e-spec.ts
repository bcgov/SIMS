import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  Institution,
  InstitutionLocation,
  OfferingStatus,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgramOffering,
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
import MockDate from "mockdate";
import { beforeEach } from "node:test";
import {
  StudyBreakAPIOutDTO,
  StudyBreaksAndWeeksOutDTO,
} from "apps/api/src/route-controllers/education-program-offering/models/education-program-offering.dto";

describe("EducationProgramOfferingInstitutionsController(e2e)-requestChange", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let studyBreak: StudyBreakAPIOutDTO;
  let studyPeriodBreakdown: Omit<StudyBreaksAndWeeksOutDTO, "studyBreaks">;

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
  });

  beforeEach(async () => {
    MockDate.reset();
  });

  it("Should process a request for offering change when passed valid data.", async () => {
    // Arrange
    const now = new Date();
    MockDate.set(now);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const educationProgram = createFakeEducationProgram({
      institution: collegeF,
      user: collegeFUser,
    });
    const savedEducationProgram =
      await db.educationProgram.save(educationProgram);

    const offering = createFakeEducationProgramOffering(
      {
        auditUser: collegeFUser,
        institution: collegeF,
        institutionLocation: collegeFLocation,
        program: savedEducationProgram,
      },
      {
        initialValues: {
          actualTuitionCosts: 1000,
          studyStartDate: "2023-09-01",
          studyEndDate: "2024-06-30",
          submittedDate: new Date(),
        },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Reduce the tuition costs by $500 via a Request for Change
    const payload = {
      offeringName: savedOffering.name,
      yearOfStudy: savedOffering.yearOfStudy,
      offeringIntensity: savedOffering.offeringIntensity,
      offeringDelivered: savedOffering.offeringDelivered,
      isAviationOffering: savedOffering.isAviationOffering,
      hasOfferingWILComponent: savedOffering.hasOfferingWILComponent,
      studyStartDate: savedOffering.studyStartDate,
      studyEndDate: savedOffering.studyEndDate,
      lacksStudyBreaks: savedOffering.lacksStudyBreaks,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
        },
      ],
      offeringType: savedOffering.offeringType,
      offeringDeclaration: savedOffering.offeringDeclaration,
      actualTuitionCosts: 500,
      programRelatedCosts: savedOffering.programRelatedCosts,
      mandatoryFees: savedOffering.mandatoryFees,
      exceptionalExpenses: savedOffering.exceptionalExpenses,
    };

    const endpoint = `/institutions/education-program-offering/${savedOffering.id}/location/${collegeFLocation.id}/education-program/${savedEducationProgram.id}/request-change`;

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
          id: true,
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
          isAviationOffering: true,
          hasOfferingWILComponent: true,
          studyBreaks: true,
          offeringDeclaration: true,
          offeringStatus: true,
          creator: {
            id: true,
          },
          submittedBy: {
            id: true,
          },
          submittedDate: true,
        },
        relations: {
          creator: true,
          submittedBy: true,
        },
        where: { id: educationProgramOfferingId },
      });

    // Assert the offering change awaiting approval
    expect(createdEducationProgramOffering).toEqual({
      id: educationProgramOfferingId,
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
      isAviationOffering: payload.isAviationOffering,
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
      offeringStatus: OfferingStatus.ChangeAwaitingApproval,
      submittedBy: { id: collegeFUser.id },
      creator: { id: collegeFUser.id },
      submittedDate: expect.any(Date),
    });

    const underReviewOffering = await db.educationProgramOffering.findOne({
      select: {
        id: true,
        offeringStatus: true,
        modifier: {
          id: true,
        },
        updatedAt: true,
      },
      relations: {
        modifier: true,
      },
      where: { id: savedOffering.id },
    });

    // Assert changed values for current offering under review
    expect(underReviewOffering).toEqual({
      id: savedOffering.id,
      offeringStatus: OfferingStatus.ChangeUnderReview,
      modifier: { id: collegeFUser.id },
      updatedAt: now,
    });
  });

  it("Should throw an UNPROCESSABLE ENTITY (422) exception when the program is inactive.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const educationProgram = createFakeEducationProgram(
      {
        institution: collegeF,
        user: collegeFUser,
      },
      {
        initialValue: {
          isActive: false,
        },
      },
    );
    const savedEducationProgram =
      await db.educationProgram.save(educationProgram);

    const offering = createFakeEducationProgramOffering(
      {
        auditUser: collegeFUser,
        institution: collegeF,
        institutionLocation: collegeFLocation,
        program: savedEducationProgram,
      },
      {
        initialValues: {
          actualTuitionCosts: 1000,
          offeringStatus: OfferingStatus.CreationDeclined,
          studyStartDate: "2023-09-01",
          studyEndDate: "2024-06-30",
          submittedDate: new Date(),
        },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Reduce the tuition costs by $500 via a Request for Change
    const payload = {
      offeringName: savedOffering.name,
      yearOfStudy: savedOffering.yearOfStudy,
      offeringIntensity: savedOffering.offeringIntensity,
      offeringDelivered: savedOffering.offeringDelivered,
      isAviationOffering: savedOffering.isAviationOffering,
      hasOfferingWILComponent: savedOffering.hasOfferingWILComponent,
      studyStartDate: savedOffering.studyStartDate,
      studyEndDate: savedOffering.studyEndDate,
      lacksStudyBreaks: savedOffering.lacksStudyBreaks,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
        },
      ],
      offeringType: savedOffering.offeringType,
      offeringDeclaration: savedOffering.offeringDeclaration,
      actualTuitionCosts: 500,
      programRelatedCosts: savedOffering.programRelatedCosts,
      mandatoryFees: savedOffering.mandatoryFees,
      exceptionalExpenses: savedOffering.exceptionalExpenses,
    };

    const endpoint = `/institutions/education-program-offering/${savedOffering.id}/location/${collegeFLocation.id}/education-program/${savedEducationProgram.id}/request-change`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "The education program is not active.",
        error: "EDUCATION_PROGRAM_IS_NOT_ACTIVE",
      });
  });

  it("Should throw an UNPROCESSABLE ENTITY (422) exception when the offering is not in Approved status.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const educationProgram = createFakeEducationProgram({
      institution: collegeF,
      user: collegeFUser,
    });
    const savedEducationProgram =
      await db.educationProgram.save(educationProgram);

    const offering = createFakeEducationProgramOffering(
      {
        auditUser: collegeFUser,
        institution: collegeF,
        institutionLocation: collegeFLocation,
        program: savedEducationProgram,
      },
      {
        initialValues: {
          actualTuitionCosts: 1000,
          offeringStatus: OfferingStatus.CreationDeclined,
          studyStartDate: "2023-09-01",
          studyEndDate: "2024-06-30",
          submittedDate: new Date(),
        },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(offering);

    // Reduce the tuition costs by $500 via a Request for Change
    const payload = {
      offeringName: savedOffering.name,
      yearOfStudy: savedOffering.yearOfStudy,
      offeringIntensity: savedOffering.offeringIntensity,
      offeringDelivered: savedOffering.offeringDelivered,
      isAviationOffering: savedOffering.isAviationOffering,
      hasOfferingWILComponent: savedOffering.hasOfferingWILComponent,
      studyStartDate: savedOffering.studyStartDate,
      studyEndDate: savedOffering.studyEndDate,
      lacksStudyBreaks: savedOffering.lacksStudyBreaks,
      studyBreaks: [
        {
          breakStartDate: studyBreak.breakStartDate,
          breakEndDate: studyBreak.breakEndDate,
        },
      ],
      offeringType: savedOffering.offeringType,
      offeringDeclaration: savedOffering.offeringDeclaration,
      actualTuitionCosts: 500,
      programRelatedCosts: savedOffering.programRelatedCosts,
      mandatoryFees: savedOffering.mandatoryFees,
      exceptionalExpenses: savedOffering.exceptionalExpenses,
    };

    const endpoint = `/institutions/education-program-offering/${savedOffering.id}/location/${collegeFLocation.id}/education-program/${savedEducationProgram.id}/request-change`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "Either offering for given location and program not found or the offering not in appropriate status to be requested for change.",
        error: "Unprocessable Entity",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
