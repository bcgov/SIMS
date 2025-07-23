import { HttpStatus, INestApplication } from "@nestjs/common";
import { Institution, InstitutionLocation, User } from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeUser,
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
import { createFakeEducationProgram } from "@sims/test-utils/factories/education-program";
import { getISODateOnlyString } from "@sims/utilities";

describe("EducationProgramInstitutionsController (e2e)", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User, sharedUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const { institution, user: institutionUser } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFLocation = createFakeInstitutionLocation({ institution: collegeF });
    await authorizeUserTokenForLocation(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
      collegeFLocation,
    );
    collegeFUser = institutionUser;
    sharedUser = createFakeUser();
    await db.user.save(sharedUser);
  });

  describe("EducationProgramInstitutionsController(e2e)-getEducationProgram", () => {
    it("Should return the education program details for a valid programId and institution.", async () => {
      // Arrange
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const program = createFakeEducationProgram({
        institution: collegeF,
        auditUser: collegeFUser,
      });
      const savedProgram = await db.educationProgram.save(program);
      const endpoint = `/institutions/education-program/${savedProgram.id}`;

      // Act
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE);

      // Assert
      expect(response.status).toBe(HttpStatus.OK);
      expect(response.body).toEqual({
        id: savedProgram.id,
        programStatus: savedProgram.programStatus,
        name: savedProgram.name,
        description: savedProgram.description,
        credentialType: savedProgram.credentialType,
        credentialTypeToDisplay: savedProgram.credentialType,
        cipCode: savedProgram.cipCode,
        nocCode: savedProgram.nocCode,
        sabcCode: savedProgram.sabcCode,
        regulatoryBody: savedProgram.regulatoryBody,
        otherRegulatoryBody: savedProgram.otherRegulatoryBody,
        programDeliveryTypes: {
          deliveredOnSite: savedProgram.deliveredOnSite,
          deliveredOnline: savedProgram.deliveredOnline,
        },
        deliveredOnlineAlsoOnsite: null,
        sameOnlineCreditsEarned: null,
        earnAcademicCreditsOtherInstitution: null,
        courseLoadCalculation: savedProgram.courseLoadCalculation,
        completionYears: savedProgram.completionYears,
        eslEligibility: savedProgram.eslEligibility,
        hasJointInstitution: savedProgram.hasJointInstitution,
        hasJointDesignatedInstitution:
          savedProgram.hasJointDesignatedInstitution,
        programIntensity: savedProgram.programIntensity,
        institutionProgramCode: null,
        minHoursWeek: null,
        isAviationProgram: savedProgram.isAviationProgram,
        credentialTypesAviation: savedProgram.credentialTypesAviation,
        minHoursWeekAvi: null,
        entranceRequirements: {
          hasMinimumAge: null,
          minHighSchool: null,
          requirementsByInstitution: null,
          requirementsByBCITA: null,
          noneOfTheAboveEntranceRequirements: null,
        },
        hasWILComponent: savedProgram.hasWILComponent,
        isWILApproved: null,
        wilProgramEligibility: null,
        hasTravel: savedProgram.hasTravel,
        travelProgramEligibility: null,
        hasIntlExchange: savedProgram.hasIntlExchange,
        intlExchangeProgramEligibility: null,
        programDeclaration: savedProgram.programDeclaration,
        institutionId: savedProgram.institution.id,
        institutionName: savedProgram.institution.operatingName,
        submittedDate: savedProgram.createdAt.toISOString(),
        submittedBy:
          savedProgram.submittedBy.firstName +
          " " +
          savedProgram.submittedBy.lastName,
        effectiveEndDate: getISODateOnlyString(savedProgram.effectiveEndDate),
        assessedDate: savedProgram.assessedDate,
        assessedBy: "",
        isBCPublic: savedProgram.institution.institutionType.isBCPublic,
        isBCPrivate: savedProgram.institution.institutionType.isBCPrivate,
        hasOfferings: false, // No offerings for this program exist.
        isActive: savedProgram.isActive,
        isExpired: savedProgram.isExpired,
      });
    });

    it("Should return NOT FOUND (404) error if the program does not exist.", async () => {
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeEReadOnlyUser,
      );
      const nonExistentProgramId = 999999;
      const endpoint = `/institutions/education-program/${nonExistentProgramId}`;
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.NOT_FOUND)
        .expect({
          statusCode: HttpStatus.NOT_FOUND,
          message: "Not able to find the requested program.",
          error: "Not Found",
        });
    });
  });
});
