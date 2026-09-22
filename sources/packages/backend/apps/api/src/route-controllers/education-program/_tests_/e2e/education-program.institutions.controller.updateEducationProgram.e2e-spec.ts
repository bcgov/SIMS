import { HttpStatus, INestApplication } from "@nestjs/common";
import { Institution, User } from "@sims/sims-db";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  BEARER_AUTH_TYPE,
  createFakeEducationProgram,
  createTestingAppModule,
  getAuthRelatedEntities,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import request from "supertest";
import MockDate from "mockdate";
import { getPayload } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-updateEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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
      user: collegeFUser,
    });
    await db.educationProgram.save(program);
    const payload = getPayload();
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

    expect(updatedProgram).toEqual({
      id: program.id,
      name: payload.name,
      description: payload.description,
      credentialType: payload.credentialType,
      cipCode: payload.cipCode,
      fieldOfStudyCode: 15,
      nocCode: payload.nocCode,
      sabcCode: payload.sabcCode,
      institutionProgramCode: payload.institutionProgramCode,
      programIntensity: payload.programIntensity,
      deliveredOnSite: true,
      deliveredOnline: false,
      deliveredOnlineAlsoOnsite: null,
      completionYears: payload.completionYears,
      courseLoadCalculation: payload.courseLoadCalculation,
      regulatoryBody: payload.regulatoryBody,
      otherRegulatoryBody: payload.otherRegulatoryBody,
      minHighSchool: true,
      hasMinimumAge: true,
      requirementsByInstitution: true,
      requirementsByBCITA: true,
      noneOfTheAboveEntranceRequirements: false,
      isAviationProgram: payload.isAviationProgram,
      eslEligibility: payload.eslEligibility,
      hasJointInstitution: payload.hasJointInstitution,
      hasWILComponent: payload.hasWILComponent,
      hasTravel: payload.hasTravel,
      hasIntlExchange: payload.hasIntlExchange,
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
      .send(getPayload())
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Not able to find the education program.",
        error: "Not Found",
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
