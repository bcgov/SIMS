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
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation(collegeF);
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
      collegeFLocation,
    );
    collegeFUser = institutionUser;
  });

  it("Should request designation for a public institution when institution user is legal signing authority.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFAdminLegalSigningUser,
    );
    const endpoint = "/institutions/education-program";
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
      totalOfferings: "",
      isBCPrivate: "",
      programStatus: ProgramStatus.Approved,
      applicationId: "",
      applicationStatus: "",
      hasOfferings: false,
    };

    // Act
    let educationProgramId;
    await request(app.getHttpServer())
      .post(endpoint)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramId = response.body.id;
      });

    // Assert
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
});
