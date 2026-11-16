import { HttpStatus, INestApplication } from "@nestjs/common";
import { EducationProgramConfiguration } from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  getMostRecentEducationProgramConfiguration,
} from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
} from "../../../../testHelpers";
import request from "supertest";

describe("EducationProgramInstitutionsController(e2e)-getEducationProgramForCreate", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    mostRecentProgramConfiguration =
      await getMostRecentEducationProgramConfiguration({ db });
  });

  [
    {
      scenario: "BC public institution",
      institutionUserType: InstitutionTokenTypes.CollegeFUser,
      isBCPrivate: false,
      isBCInstitution: true,
    },
    {
      scenario: "BC private institution",
      institutionUserType: InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
      isBCPrivate: true,
      isBCInstitution: true,
    },
    {
      scenario: "Non-BC institution",
      institutionUserType:
        InstitutionTokenTypes.CollegeDAdminNonLegalSigningUser,
      isBCPrivate: false,
      isBCInstitution: false,
    },
  ].forEach(
    ({ scenario, institutionUserType, isBCInstitution, isBCPrivate }) => {
      it(`Should return the active program configuration for the program year when requested by a ${scenario}.`, async () => {
        // Arrange
        const institutionUserToken =
          await getInstitutionToken(institutionUserType);

        // Act/Assert
        await request(app.getHttpServer())
          .get(
            getEndpoint({
              programYearId: mostRecentProgramConfiguration.programYear.id,
            }),
          )
          .auth(institutionUserToken, BEARER_AUTH_TYPE)
          .expect(HttpStatus.OK)
          .expect({
            configurationId: mostRecentProgramConfiguration.id,
            programYearName:
              mostRecentProgramConfiguration.programYear.programYear,
            programData: {
              context: {
                // No program exists yet, hence no offerings.
                isFullUpdateRestricted: false,
                isBCPrivate,
                isBCInstitution,
              },
            },
            visualSchema: mostRecentProgramConfiguration.visualSchema,
            validationSchema: mostRecentProgramConfiguration.validationSchema,
          });
      });
    },
  );

  it("Should throw not found error when the program year has no active program configuration.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint({ programYearId: 99999 }))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "The provided program year does not have an active program configuration.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get API endpoint.
 * @param options endpoint options.
 * - `programYearId` ID of the program year to get the creation configuration for.
 * @returns the API endpoint.
 */
function getEndpoint(options: { programYearId: number }): string {
  return `/institutions/education-program/program-year/${options.programYearId}/create`;
}
