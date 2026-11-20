import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import request from "supertest";
import { ensureGetEducationProgramForRenewConfigurations } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-getEducationProgramForRenew", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let collegeC: Institution;
  let collegeCUser: User;
  /**
   * Configuration of the program year from which the program can be renewed.
   * This configuration is inactive to simulate the scenario where the program
   * can only be renewed if the next program year has an active configuration.
   */
  let renewableProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the program year immediately after the renewable one.
   */
  let nextProgramConfiguration: EducationProgramConfiguration;
  /**
   * Configuration of the program year whose next program year has no active configuration.
   */
  let notRenewableProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    const [collegeFEntities, collegeCEntities] = await Promise.all([
      getAuthRelatedEntities(db.dataSource, InstitutionTokenTypes.CollegeFUser),
      getAuthRelatedEntities(
        db.dataSource,
        InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
      ),
    ]);
    collegeF = collegeFEntities.institution;
    collegeFUser = collegeFEntities.user;
    collegeC = collegeCEntities.institution;
    collegeCUser = collegeCEntities.user;
    ({
      renewableProgramConfiguration,
      nextProgramConfiguration,
      notRenewableProgramConfiguration,
    } = await ensureGetEducationProgramForRenewConfigurations(db));
  });

  it("Should return the next program configuration for renewal including the program data from the program being renewed when the next program year has an active configuration.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      renewableProgramConfiguration,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programId: program.id }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        configurationId: nextProgramConfiguration.id,
        programYearName: nextProgramConfiguration.programYear.programYear,
        hasActiveProgramYearConfiguration: true,
        programData: {
          ...program.programData,
          context: {
            // The new program to be created through the renewal has no offerings.
            isFullUpdateRestricted: false,
            isBCPrivate: false,
            isBCInstitution: true,
          },
        },
        visualSchema: nextProgramConfiguration.visualSchema,
        validationSchema: nextProgramConfiguration.validationSchema,
      });
  });

  it("Should throw not found error when the program does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programId: 999999 }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the requested program.",
        error: "Not Found",
      });
  });

  it("Should throw not found error when the program belongs to a different institution.", async () => {
    // Arrange
    const collegeCProgram = await saveEducationProgram(
      collegeC,
      collegeCUser,
      renewableProgramConfiguration,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programId: collegeCProgram.id }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the requested program.",
        error: "Not Found",
      });
  });

  it("Should throw unprocessable entity error when the next program year has no active program configuration.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      notRenewableProgramConfiguration,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programId: program.id }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message:
          "The next program configuration for renewal could not be found.",
        error: "Unprocessable Entity",
      });
  });

  /**
   * Saves an education program associated with the provided configuration.
   * @param institution institution the program belongs to.
   * @param auditUser user creating the program.
   * @param programConfiguration configuration associated with the program.
   * @returns the saved education program.
   */
  function saveEducationProgram(
    institution: Institution,
    auditUser: User,
    programConfiguration: EducationProgramConfiguration,
  ): Promise<EducationProgram> {
    const program = createFakeEducationProgram({
      institution,
      auditUser,
      programConfiguration,
    });
    return db.educationProgram.save(program);
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get API endpoint.
 * @param options endpoint options.
 * - `programId` ID of the education program to be renewed.
 * @returns the API endpoint.
 */
function getEndpoint(options: { programId: number }): string {
  return `/institutions/education-program/${options.programId}/renew`;
}
