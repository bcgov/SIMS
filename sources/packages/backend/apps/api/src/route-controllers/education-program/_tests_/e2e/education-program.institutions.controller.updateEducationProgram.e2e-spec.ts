import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgramConfiguration,
  Institution,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
  createFakeEducationProgramOffering,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import request from "supertest";
import MockDate from "mockdate";
import {
  ensureUpdateEducationProgramConfigurations,
  getUpdatePayload,
} from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-updateEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;
  /**
   * Inactive configuration of a program year that also has an active configuration.
   */
  let outdatedProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the same program year as the outdated configuration.
   */
  let activeProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    mostRecentProgramConfiguration =
      await getMostRecentEducationProgramConfiguration({ db });
    ({ outdatedProgramConfiguration, activeProgramConfiguration } =
      await ensureUpdateEducationProgramConfigurations(db));
    const { institution, user } = await getAuthRelatedEntities(
      db.dataSource,
      InstitutionTokenTypes.CollegeFUser,
    );
    collegeF = institution;
    collegeFUser = user;
  });

  beforeEach(() => {
    MockDate.reset();
  });

  it("Should update education program when a valid program and payload are provided.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeF,
      auditUser: collegeFUser,
      programConfiguration: mostRecentProgramConfiguration,
    });
    await db.educationProgram.save(program);
    const payload = getUpdatePayload(mostRecentProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const now = new Date();
    MockDate.set(now);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(program.id))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        name: true,
        description: true,
        credentialType: true,
        cipCode: true,
        fieldOfStudyCode: true,
        nocCode: true,
        sabcCode: true,
        institutionProgramCode: true,
        programIntensity: true,
        deliveredOnSite: true,
        deliveredOnline: true,
        deliveredOnlineAlsoOnsite: true,
        completionYears: true,
        courseLoadCalculation: true,
        regulatoryBody: true,
        otherRegulatoryBody: true,
        minHighSchool: true,
        hasMinimumAge: true,
        requirementsByInstitution: true,
        requirementsByBCITA: true,
        noneOfTheAboveEntranceRequirements: true,
        isAviationProgram: true,
        eslEligibility: true,
        hasJointInstitution: true,
        hasWILComponent: true,
        hasTravel: true,
        hasIntlExchange: true,
        programDeclaration: true,
        updatedAt: true,
        modifier: { id: true },
      },
      relations: { modifier: true },
      where: { id: program.id },
      loadEagerRelations: false,
    });

    const { programData } = payload;
    expect(updatedProgram).toEqual({
      id: program.id,
      name: programData.programName,
      description: programData.programDescription,
      credentialType: programData.credentialType,
      cipCode: programData.cipCode,
      fieldOfStudyCode: 15,
      nocCode: programData.nocCode,
      sabcCode: programData.sabcCode,
      institutionProgramCode: programData.institutionProgramCode,
      programIntensity: programData.programIntensity,
      deliveredOnSite: true,
      deliveredOnline: false,
      deliveredOnlineAlsoOnsite: null,
      completionYears: programData.completionYears,
      courseLoadCalculation: programData.courseLoadCalculation,
      regulatoryBody: programData.regulatoryBody,
      otherRegulatoryBody: programData.otherRegulatoryBody,
      minHighSchool: true,
      hasMinimumAge: true,
      requirementsByInstitution: true,
      requirementsByBCITA: true,
      noneOfTheAboveEntranceRequirements: false,
      isAviationProgram: programData.isAviationProgram,
      eslEligibility: programData.eslEligibility,
      hasJointInstitution: programData.hasJointInstitution,
      hasWILComponent: programData.hasWILComponent,
      hasTravel: programData.hasTravel,
      hasIntlExchange: programData.hasIntlExchange,
      programDeclaration: true,
      updatedAt: now,
      modifier: { id: collegeFUser.id },
    });
  });

  it("Should return program not found when the program does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(999999))
      .send(getUpdatePayload(mostRecentProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the education program.",
        error: "Not Found",
      });
  });

  it("Should update the education program associating it with the active program configuration of the program year when the program has no offerings and was saved with an inactive configuration.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeF,
      auditUser: collegeFUser,
      programConfiguration: outdatedProgramConfiguration,
    });
    await db.educationProgram.save(program);
    const payload = getUpdatePayload(activeProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(program.id))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);

    const updatedProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        name: true,
        programConfiguration: { id: true },
      },
      relations: { programConfiguration: true },
      where: { id: program.id },
      loadEagerRelations: false,
    });
    expect(updatedProgram).toEqual({
      id: program.id,
      name: payload.programData.programName,
      programConfiguration: { id: activeProgramConfiguration.id },
    });
  });

  it("Should throw unprocessable entity error when the program has no offerings and the program configuration provided is not the active one for the program year.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeF,
      auditUser: collegeFUser,
      programConfiguration: outdatedProgramConfiguration,
    });
    await db.educationProgram.save(program);
    // Program data filled using the configuration the program was saved with,
    // instead of the active configuration expected for a full update.
    const payload = getUpdatePayload(outdatedProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(program.id))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        errorType: "EDUCATION_PROGRAM_CONFIGURATION_OUTDATED",
        message:
          "The program configuration has changed since the program data was retrieved.",
      });
  });

  it("Should throw unprocessable entity error when the program data was retrieved for a full update and the program has offerings now.", async () => {
    // Arrange
    const program = createFakeEducationProgram({
      institution: collegeF,
      auditUser: collegeFUser,
      programConfiguration: activeProgramConfiguration,
    });
    await db.educationProgram.save(program);
    // Offering added after the program data was retrieved for a full update.
    const offering = createFakeEducationProgramOffering({
      auditUser: collegeFUser,
      program,
    });
    await db.educationProgramOffering.save(offering);
    const payload = getUpdatePayload(activeProgramConfiguration.id, {
      isFullUpdateRestricted: false,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .patch(getEndpoint(program.id))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        errorType: "EDUCATION_PROGRAM_UPDATE_RESTRICTION_CHANGED",
        message: "This program can no longer be fully edited.",
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the endpoint URL for updating an education program by its ID.
 * @param programId The ID of the education program.
 * @returns The endpoint URL for the specified education program.
 */
function getEndpoint(programId: number): string {
  return `/institutions/education-program/${programId}`;
}
