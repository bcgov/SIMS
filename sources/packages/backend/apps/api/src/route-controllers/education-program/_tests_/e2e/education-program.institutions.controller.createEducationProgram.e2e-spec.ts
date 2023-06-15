import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  Institution,
  InstitutionLocation,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  getProviderInstanceForModule,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  authorizeUserTokenForLocation,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import * as request from "supertest";
import { FormService } from "../../../../services";
import { DryRunSubmissionResult } from "../../../../types";
import { TestingModule } from "@nestjs/testing";
import { AppInstitutionsModule } from "../../../../app.institutions.module";

describe("EducationProgramOfferingInstitutionsController(e2e)-createOffering", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User;
  let testingModule: TestingModule;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user: institutionUser } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    collegeFUser = institutionUser;
    testingModule = module;
  });

  it("Should create an education program when valid data is passed.", async () => {
    // Arrange
    const payload = {
      name: "Education Program test",
      description: "Education Program description...",
      credentialType: "undergraduateCertificate",
      cipCode: "11.1111",
      fieldOfStudyCode: "15",
      nocCode: "2174",
      sabcCode: "PQP0",
      institutionProgramCode: "DDD",
      programIntensity: "Full Time and Part Time",
      programDeliveryTypes: {
        deliveredOnSite: true,
        deliveredOnline: false,
      },
      completionYears: "12WeeksToLessThan1Year",
      courseLoadCalculation: "credit",
      regulatoryBody: "ptib",
      entranceRequirements: {
        minHighSchool: true,
        hasMinimumAge: true,
        requirementsByInstitution: true,
        requirementsByBCITA: true,
      },
      eslEligibility: "lessThan20",
      hasJointInstitution: "no",
      hasWILComponent: "no",
      hasTravel: "no",
      hasIntlExchange: "no",
      programDeclaration: true,
      programStatus: ProgramStatus.Approved,
      hasOfferings: false,
    };
    const formService = await getProviderInstanceForModule(
      testingModule,
      AppInstitutionsModule,
      FormService,
    );
    formService.dryRunSubmission = jest
      .fn()
      .mockResolvedValue({ valid: true, data: { data: payload } });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = "/institutions/education-program";

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramId = response.body.id;
      });

    const educationProgram = await db.educationProgram.findOne({
      where: { id: educationProgramId },
    });
    expect(educationProgram).toEqual(
      expect.objectContaining({
        name: payload.name,
        description: payload.description,
        credentialType: payload.credentialType,
        cipCode: payload.cipCode,
        nocCode: payload.nocCode,
        sabcCode: payload.sabcCode,
        regulatoryBody: payload.regulatoryBody,
        deliveredOnSite: payload.programDeliveryTypes.deliveredOnSite,
        deliveredOnline: payload.programDeliveryTypes.deliveredOnline,
        deliveredOnlineAlsoOnsite: null,
        sameOnlineCreditsEarned: null,
        earnAcademicCreditsOtherInstitution: null,
        courseLoadCalculation: payload.courseLoadCalculation,
        completionYears: payload.completionYears,
        hasMinimumAge: true,
        eslEligibility: payload.eslEligibility,
        hasJointInstitution: payload.hasJointInstitution,
        hasJointDesignatedInstitution: null,
        programStatus: payload.programStatus,
        programIntensity: payload.programIntensity,
        institutionProgramCode: payload.institutionProgramCode,
        minHoursWeek: null,
        isAviationProgram: null,
        minHoursWeekAvi: null,
        minHighSchool: true,
        requirementsByInstitution: true,
        requirementsByBCITA: true,
        hasWILComponent: payload.hasWILComponent,
        isWILApproved: null,
        wilProgramEligibility: null,
        hasTravel: payload.hasTravel,
        travelProgramEligibility: null,
        hasIntlExchange: payload.hasIntlExchange,
        intlExchangeProgramEligibility: null,
        programDeclaration: payload.programDeclaration,
        assessedDate: null,
        effectiveEndDate: null,
        fieldOfStudyCode: Number.parseInt(payload.fieldOfStudyCode),
        institutionId: collegeF.id,
        programNoteId: null,
        assessedById: null,
        submittedById: collegeFUser.id,
      }),
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
