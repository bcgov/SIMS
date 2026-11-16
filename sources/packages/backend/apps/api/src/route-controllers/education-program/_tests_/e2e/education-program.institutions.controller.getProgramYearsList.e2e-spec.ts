import { HttpStatus, INestApplication } from "@nestjs/common";
import { ProgramYear } from "@sims/sims-db";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
} from "../../../../testHelpers";
import request from "supertest";
import { EducationProgramYearAPIOutDTO } from "../../models/education-program.dto";
import { ensureGetProgramYearsListProgramYears } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-getProgramYearsList", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  /**
   * Program year with an active and an inactive program configuration.
   */
  let activeConfigurationProgramYear: ProgramYear;
  /**
   * Program year with only an inactive program configuration.
   */
  let inactiveConfigurationProgramYear: ProgramYear;
  /**
   * Program year without any program configuration.
   */
  let noConfigurationProgramYear: ProgramYear;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
    ({
      activeConfigurationProgramYear,
      inactiveConfigurationProgramYear,
      noConfigurationProgramYear,
    } = await ensureGetProgramYearsListProgramYears(db));
  });

  it("Should return the program years with at least one program configuration, indicating whether they have an active configuration, ordered by the most recent program year first.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let programYears: EducationProgramYearAPIOutDTO[];
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        programYears = response.body;
      });

    // Program years are shared across tests running in parallel, hence only the
    // program years created by this test are asserted.
    const testProgramYearIds = [
      activeConfigurationProgramYear.id,
      inactiveConfigurationProgramYear.id,
      noConfigurationProgramYear.id,
    ];
    const testProgramYears = programYears.filter((programYear) =>
      testProgramYearIds.includes(programYear.id),
    );
    // The program year without configurations must not be returned, each program year
    // must be returned only once, and the most recent program year must be returned first.
    expect(testProgramYears).toEqual([
      // Program year with only an inactive configuration.
      {
        id: inactiveConfigurationProgramYear.id,
        description: inactiveConfigurationProgramYear.programYear,
        hasActiveProgramConfiguration: false,
      },
      // Program year with both active and inactive configurations.
      {
        id: activeConfigurationProgramYear.id,
        description: activeConfigurationProgramYear.programYear,
        hasActiveProgramConfiguration: true,
      },
    ]);
  });

  it("Should return the program years list when the user is read-only.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(getEndpoint())
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual(
          expect.arrayContaining([
            {
              id: activeConfigurationProgramYear.id,
              description: activeConfigurationProgramYear.programYear,
              hasActiveProgramConfiguration: true,
            },
          ]),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get API endpoint.
 * @returns the API endpoint.
 */
function getEndpoint(): string {
  return "/institutions/education-program/program-years-list";
}
