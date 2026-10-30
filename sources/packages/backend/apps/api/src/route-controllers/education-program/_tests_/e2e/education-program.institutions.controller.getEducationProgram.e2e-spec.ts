import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgramConfiguration,
  Institution,
  InstitutionLocation,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeInstitutionLocation,
  createFakeUser,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  authorizeUserTokenForLocation,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import request from "supertest";
import { createFakeEducationProgram } from "@sims/test-utils/factories/education-program";
import { getISODateOnlyString } from "@sims/utilities";

describe("EducationProgramInstitutionsController(e2e)-getEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFLocation: InstitutionLocation;
  let collegeFUser: User, sharedUser: User;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    mostRecentProgramConfiguration =
      await getMostRecentEducationProgramConfiguration({ db });
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
        programConfiguration: mostRecentProgramConfiguration,
      });
      const savedProgram = await db.educationProgram.save(program);
      const { isBCPublic, isBCPrivate } =
        savedProgram.institution.institutionType;
      const endpoint = `/institutions/education-program/${savedProgram.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          id: savedProgram.id,
          configurationId: mostRecentProgramConfiguration.id,
          programData: {
            ...savedProgram.programData,
            context: {
              isFullUpdateRestricted: false, // No offerings for this program exist.
              isBCPrivate,
              isBCInstitution: isBCPublic || isBCPrivate,
            },
          },
          visualSchema: mostRecentProgramConfiguration.visualSchema,
          validationSchema: mostRecentProgramConfiguration.validationSchema,
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
          name: savedProgram.name,
          description: savedProgram.description,
          programStatus: savedProgram.programStatus,
          credentialType: savedProgram.credentialType,
          credentialTypeToDisplay: savedProgram.credentialType,
          cipCode: savedProgram.cipCode,
          nocCode: savedProgram.nocCode,
          sabcCode: savedProgram.sabcCode,
          institutionProgramCode: null,
          programIntensity: savedProgram.programIntensity,
          isActive: savedProgram.isActive,
          isExpired: savedProgram.isExpired,
        });
    });

    it("Should throw a HttpStatus Not Found (404) error when a program does not exist.", async () => {
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
