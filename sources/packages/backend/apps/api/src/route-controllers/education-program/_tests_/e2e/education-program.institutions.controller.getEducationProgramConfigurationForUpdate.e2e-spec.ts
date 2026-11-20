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
  createFakeEducationProgramOffering,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
} from "../../../../testHelpers";
import request from "supertest";
import { ensureGetEducationProgramForUpdateConfigurations } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-getEducationProgramConfigurationForUpdate", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let collegeC: Institution;
  let collegeCUser: User;
  /**
   * Inactive configuration of a program year that also has an active configuration.
   */
  let outdatedProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the same program year as the outdated configuration.
   */
  let activeProgramConfiguration: EducationProgramConfiguration;
  /**
   * Inactive configuration of a program year without an active configuration.
   */
  let noActiveProgramConfiguration: EducationProgramConfiguration;

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
      outdatedProgramConfiguration,
      activeProgramConfiguration,
      noActiveProgramConfiguration,
    } = await ensureGetEducationProgramForUpdateConfigurations(db));
  });

  it("Should return the active program configuration of the program year including the program data when the program has no offerings and was saved with an inactive configuration.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      outdatedProgramConfiguration,
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
        configurationId: activeProgramConfiguration.id,
        programYearName: activeProgramConfiguration.programYear.programYear,
        hasActiveProgramYearConfiguration: true,
        programData: {
          ...program.programData,
          context: {
            isFullUpdateRestricted: false,
            isBCPrivate: false,
            isBCInstitution: true,
          },
        },
        visualSchema: activeProgramConfiguration.visualSchema,
        validationSchema: activeProgramConfiguration.validationSchema,
      });
  });

  it("Should return the program configuration the program was saved with including the program data when the program has offerings.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      outdatedProgramConfiguration,
    );
    const offering = createFakeEducationProgramOffering({
      auditUser: collegeFUser,
      program,
    });
    await db.educationProgramOffering.save(offering);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programId: program.id }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        configurationId: outdatedProgramConfiguration.id,
        programYearName: outdatedProgramConfiguration.programYear.programYear,
        // The program year still has an active configuration, other than the program one.
        hasActiveProgramYearConfiguration: true,
        programData: {
          ...program.programData,
          context: {
            isFullUpdateRestricted: true,
            isBCPrivate: false,
            isBCInstitution: true,
          },
        },
        visualSchema: outdatedProgramConfiguration.visualSchema,
        validationSchema: outdatedProgramConfiguration.validationSchema,
      });
  });

  it("Should throw unprocessable entity error when the program has offerings and its program year has no active program configuration.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      noActiveProgramConfiguration,
    );
    const offering = createFakeEducationProgramOffering({
      auditUser: collegeFUser,
      program,
    });
    await db.educationProgramOffering.save(offering);
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
          "The program year does not have an active program configuration.",
        error: "Unprocessable Entity",
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
      activeProgramConfiguration,
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

  it("Should throw unprocessable entity error when the program is inactive.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      activeProgramConfiguration,
      { isActive: false },
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
        message: "Education program cannot be edited when inactive.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw unprocessable entity error when the program has no offerings and its program year has no active program configuration.", async () => {
    // Arrange
    const program = await saveEducationProgram(
      collegeF,
      collegeFUser,
      noActiveProgramConfiguration,
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
          "The program year does not have an active program configuration.",
        error: "Unprocessable Entity",
      });
  });

  /**
   * Saves an education program associated with the provided configuration.
   * @param institution institution the program belongs to.
   * @param auditUser user creating the program.
   * @param programConfiguration configuration associated with the program.
   * @param initialValues optional initial values for the program.
   * @returns the saved education program.
   */
  function saveEducationProgram(
    institution: Institution,
    auditUser: User,
    programConfiguration: EducationProgramConfiguration,
    initialValues?: Partial<EducationProgram>,
  ): Promise<EducationProgram> {
    const program = createFakeEducationProgram(
      {
        institution,
        auditUser,
        programConfiguration,
      },
      { initialValues },
    );
    return db.educationProgram.save(program);
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get API endpoint.
 * @param options endpoint options.
 * - `programId` ID of the education program to be updated.
 * @returns the API endpoint.
 */
function getEndpoint(options: { programId: number }): string {
  return `/institutions/education-program/${options.programId}/update`;
}
