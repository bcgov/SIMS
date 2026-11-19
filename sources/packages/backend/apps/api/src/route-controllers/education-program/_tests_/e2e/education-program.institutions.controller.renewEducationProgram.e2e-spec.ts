import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramConfiguration,
  Institution,
  ProgramStatus,
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
import { faker } from "@faker-js/faker";
import {
  ensureRenewEducationProgramConfigurations,
  getCreationPayload,
} from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-renewEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let collegeC: Institution;
  let collegeCUser: User;
  /**
   * Configuration of the first program year in the renewal chain.
   * Inactive to ensure the renewal depends only on the next program year
   * having an active configuration.
   */
  let firstProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the program year immediately after {@link firstProgramConfiguration}.
   */
  let secondProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the program year immediately after {@link secondProgramConfiguration}.
   */
  let thirdProgramConfiguration: EducationProgramConfiguration;
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
      firstProgramConfiguration,
      secondProgramConfiguration,
      thirdProgramConfiguration,
      notRenewableProgramConfiguration,
    } = await ensureRenewEducationProgramConfigurations(db));
  });

  it("Should renew an education program into the next program year configuration when valid data is passed.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    const payload = getCreationPayload(secondProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    // Removing fieldOfStudyCode to ensure it will be calculated on the server.
    delete payload.programData.fieldOfStudyCode;

    // Act/Assert
    let renewedProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        renewedProgramId = response.body.id;
      });

    const renewedProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        name: true,
        description: true,
        sabcCode: true,
        programStatus: true,
        fieldOfStudyCode: true,
        isActive: true,
        programData: true,
        programConfiguration: { id: true },
        parentProgram: { id: true },
        precedingProgram: { id: true },
        institution: { id: true },
        submittedBy: { id: true },
      },
      relations: {
        programConfiguration: true,
        parentProgram: true,
        precedingProgram: true,
        institution: true,
        submittedBy: true,
      },
      where: { id: renewedProgramId },
    });
    const { programData } = payload;
    expect(renewedProgram).toEqual({
      id: renewedProgramId,
      name: programData.programName,
      description: programData.programDescription,
      sabcCode: programData.sabcCode,
      programStatus: ProgramStatus.Approved,
      fieldOfStudyCode: 15,
      isActive: true,
      // Field of study code is calculated and added to the persisted program data.
      programData: { ...programData, fieldOfStudyCode: 15 },
      programConfiguration: { id: secondProgramConfiguration.id },
      // The program being renewed is the first one in the renewal chain.
      parentProgram: { id: programToRenew.id },
      precedingProgram: { id: programToRenew.id },
      institution: { id: collegeF.id },
      submittedBy: { id: collegeFUser.id },
    });
    // The program being renewed must not be changed.
    const updatedProgramToRenew = await db.educationProgram.findOne({
      select: {
        id: true,
        isActive: true,
        programConfiguration: { id: true },
        renewedProgram: { id: true },
      },
      relations: { programConfiguration: true, renewedProgram: true },
      where: { id: programToRenew.id },
    });
    expect(updatedProgramToRenew).toEqual({
      id: programToRenew.id,
      isActive: true,
      programConfiguration: { id: firstProgramConfiguration.id },
      renewedProgram: { id: renewedProgramId },
    });
  });

  it("Should keep the first program in the renewal chain as the parent program when renewing a program that was already renewed from another program.", async () => {
    // Arrange
    const firstProgram = await saveEducationProgram(firstProgramConfiguration);
    const secondProgram = await saveEducationProgram(
      secondProgramConfiguration,
      { parentProgram: firstProgram, precedingProgram: firstProgram },
    );
    const payload = getCreationPayload(thirdProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let renewedProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: secondProgram.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        renewedProgramId = response.body.id;
      });

    const renewedProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        programConfiguration: { id: true },
        parentProgram: { id: true },
        precedingProgram: { id: true },
      },
      relations: {
        programConfiguration: true,
        parentProgram: true,
        precedingProgram: true,
      },
      where: { id: renewedProgramId },
    });
    expect(renewedProgram).toEqual({
      id: renewedProgramId,
      programConfiguration: { id: thirdProgramConfiguration.id },
      parentProgram: { id: firstProgram.id },
      precedingProgram: { id: secondProgram.id },
    });
  });

  it("Should renew an education program when the SABC code is the same as the one from the program being renewed.", async () => {
    // Arrange
    const sabcCode = getRandomSABCCode();
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
      { sabcCode },
    );
    const payload = getCreationPayload(secondProgramConfiguration.id, {
      appendedProgramData: { sabcCode },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let renewedProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        renewedProgramId = response.body.id;
      });

    const renewedProgram = await db.educationProgram.findOne({
      select: { id: true, sabcCode: true },
      where: { id: renewedProgramId },
    });
    expect(renewedProgram).toEqual({ id: renewedProgramId, sabcCode });
  });

  it("Should not renew an education program when user is read-only.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(getCreationPayload(secondProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "You are not authorized to create or modify a program.",
        error: "Forbidden",
      });
  });

  it("Should throw not found error when the program to be renewed does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: 999999 }))
      .send(getCreationPayload(secondProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the education program to renew from.",
        error: "Not Found",
      });
  });

  it("Should throw not found error when the program to be renewed belongs to a different institution.", async () => {
    // Arrange
    const collegeCProgram = await saveEducationProgram(
      firstProgramConfiguration,
      { institution: collegeC, auditUser: collegeCUser },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: collegeCProgram.id }))
      .send(getCreationPayload(secondProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the education program to renew from.",
        error: "Not Found",
      });
  });

  it("Should throw unprocessable entity error when the program has already been renewed.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    // Program already renewed from the program to be renewed.
    await saveEducationProgram(secondProgramConfiguration, {
      parentProgram: programToRenew,
      precedingProgram: programToRenew,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(getCreationPayload(secondProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: "The education program has already been renewed.",
        error: "Unprocessable Entity",
      });
  });

  it("Should throw unprocessable entity error when the next program year has no active program configuration.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      notRenewableProgramConfiguration,
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(getCreationPayload(secondProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: `No next program configuration found for renewal for the program ID ${programToRenew.id}.`,
        error: "Unprocessable Entity",
      });
  });

  it("Should throw unprocessable entity error when the program configuration provided is not the next program configuration for renewal.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    // Program data filled using a configuration other than the expected one for the renewal.
    const payload = getCreationPayload(thirdProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        errorType: "EDUCATION_PROGRAM_CONFIGURATION_OUTDATED",
        message:
          "The program configuration has changed since the program data was retrieved.",
      });
  });

  it("Should throw duplicate SABC code error when there is already an active education program with the same SABC code in the next program year.", async () => {
    // Arrange
    const sabcCode = getRandomSABCCode();
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    // Active program in the next program year with the same SABC code.
    await saveEducationProgram(secondProgramConfiguration, { sabcCode });
    const payload = getCreationPayload(secondProgramConfiguration.id, {
      appendedProgramData: { sabcCode },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        errorType: "DUPLICATE_SABC_CODE",
        message: "Duplicate SABC code.",
      });
  });

  it("Should throw bad request error when the program data is not valid.", async () => {
    // Arrange
    const programToRenew = await saveEducationProgram(
      firstProgramConfiguration,
    );
    const payload = getCreationPayload(secondProgramConfiguration.id, {
      appendedProgramData: { programDeclaration: false },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint({ programId: programToRenew.id }))
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        message: ["programDeclaration must be equal to constant: true"],
        error: "Education program data is not valid.",
        statusCode: HttpStatus.BAD_REQUEST,
      });
  });

  /**
   * Saves an education program associated with the provided configuration.
   * @param programConfiguration configuration associated with the program.
   * @param options method options.
   * - `institution` institution the program belongs to. Defaults to College F.
   * - `auditUser` user creating the program. Defaults to the College F user.
   * - `sabcCode` SABC code of the program.
   * - `parentProgram` first program in the renewal chain. When not provided,
   * the saved program is associated as its own parent program.
   * - `precedingProgram` program from which the saved program was renewed.
   * @returns the saved education program.
   */
  async function saveEducationProgram(
    programConfiguration: EducationProgramConfiguration,
    options?: {
      institution?: Institution;
      auditUser?: User;
      sabcCode?: string;
      parentProgram?: EducationProgram;
      precedingProgram?: EducationProgram;
    },
  ): Promise<EducationProgram> {
    const program = createFakeEducationProgram(
      {
        institution: options?.institution ?? collegeF,
        auditUser: options?.auditUser ?? collegeFUser,
        programConfiguration,
      },
      { initialValues: { sabcCode: options?.sabcCode } },
    );
    program.parentProgram = options?.parentProgram;
    program.precedingProgram = options?.precedingProgram;
    const savedProgram = await db.educationProgram.save(program);
    if (!options?.parentProgram) {
      // A program not created from a renewal is its own parent program.
      await db.educationProgram.update(
        { id: savedProgram.id },
        { parentProgram: { id: savedProgram.id } },
      );
    }
    return savedProgram;
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Generates a random SABC code to avoid conflicts between test executions.
 * @returns random SABC code.
 */
function getRandomSABCCode(): string {
  return `${faker.string.alpha({ length: 3, casing: "upper" })}1`;
}

/**
 * Get API endpoint.
 * @param options endpoint options.
 * - `programId` ID of the education program to be renewed.
 * @returns the API endpoint.
 */
function getEndpoint(options: { programId: number }): string {
  return `/institutions/education-program/${options.programId}/renew`;
}
