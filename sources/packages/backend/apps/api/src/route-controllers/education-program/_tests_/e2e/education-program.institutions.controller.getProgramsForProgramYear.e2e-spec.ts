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
  ensureEducationProgramConfigurationExists,
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
  EducationProgramManagerDetailsAPIOutDTO,
  ProgramRenewalStatus,
} from "../../models/education-program.dto";
import { ensureGetProgramsForProgramYearConfigurations } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-getProgramsForProgramYear", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let collegeC: Institution;
  let collegeCUser: User;
  /**
   * Configuration of the program year whose programs can be renewed.
   */
  let renewableProgramConfiguration: EducationProgramConfiguration;
  /**
   * Active configuration of the same program year as the renewable configuration
   * (the renewable configuration is inactive).
   */
  let renewableActiveProgramConfiguration: EducationProgramConfiguration;
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
    } = await ensureGetProgramsForProgramYearConfigurations(db));
    renewableActiveProgramConfiguration =
      await ensureEducationProgramConfigurationExists(
        db,
        renewableProgramConfiguration.programYear,
      );
  });

  it("Should return only the institution programs for the program year with their renewal status when the next program year has an active configuration.", async () => {
    // Arrange
    // A UUID is embedded in the names so that searchCriteria can isolate programs
    // created in this test from programs created by other tests or executions.
    const searchCriteria = faker.string.uuid();
    const notRenewedProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      { initialValues: { name: `Alpha ${searchCriteria}` } },
    );
    // Program associated with the active configuration of the same program year.
    const renewedProgram = await saveEducationProgram(
      renewableActiveProgramConfiguration,
      { initialValues: { name: `Beta ${searchCriteria}` } },
    );
    // Program from the next program year, renewed from the program above,
    // that must not be returned since it belongs to a different program year.
    await saveEducationProgram(nextProgramConfiguration, {
      initialValues: { name: `Charlie ${searchCriteria}` },
      precedingProgram: renewedProgram,
    });
    // Program from a different institution that must not be returned.
    await saveEducationProgram(renewableProgramConfiguration, {
      initialValues: { name: `Delta ${searchCriteria}` },
      institution: collegeC,
      auditUser: collegeCUser,
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria,
      sortField: "programName",
      sortOrder: "ASC",
    });

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 2,
        results: [
          getExpectedProgram(notRenewedProgram, ProgramRenewalStatus.Available),
          getExpectedProgram(renewedProgram, ProgramRenewalStatus.Renewed),
        ],
      });
  });

  it(`Should return the programs with renewal status "${ProgramRenewalStatus.NotAvailable}" when the next program year has no active configuration.`, async () => {
    // Arrange
    const searchCriteria = faker.string.uuid();
    const program = await saveEducationProgram(
      notRenewableProgramConfiguration,
      { initialValues: { name: `Alpha ${searchCriteria}` } },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(
      notRenewableProgramConfiguration.programYear.id,
      { searchCriteria },
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 1,
        results: [
          getExpectedProgram(program, ProgramRenewalStatus.NotAvailable),
        ],
      });
  });

  it("Should return the programs sorted by program status (pending, approved, declined, and inactive) and then by name when no sort field is provided.", async () => {
    // Arrange
    // Names in the reverse order of the expected program status order to
    // ensure the programs are not sorted by name.
    const searchCriteria = faker.string.uuid();
    const inactiveProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      {
        initialValues: {
          name: `Alpha ${searchCriteria}`,
          programStatus: ProgramStatus.Approved,
          isActive: false,
        },
      },
    );
    const declinedProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      {
        initialValues: {
          name: `Bravo ${searchCriteria}`,
          programStatus: ProgramStatus.Declined,
        },
      },
    );
    // Programs associated with the active configuration of the same program year
    // are expected to be sorted along with the other programs.
    const approvedProgram = await saveEducationProgram(
      renewableActiveProgramConfiguration,
      {
        initialValues: {
          name: `Charlie ${searchCriteria}`,
          programStatus: ProgramStatus.Approved,
        },
      },
    );
    // Pending program saved before the next pending program, but expected
    // after it, to ensure the programs with the same status are sorted by name.
    const secondPendingProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      {
        initialValues: {
          name: `Echo ${searchCriteria}`,
          programStatus: ProgramStatus.Pending,
        },
      },
    );
    const firstPendingProgram = await saveEducationProgram(
      renewableActiveProgramConfiguration,
      {
        initialValues: {
          name: `Delta ${searchCriteria}`,
          programStatus: ProgramStatus.Pending,
        },
      },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria,
    });

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 5,
        results: [
          getExpectedProgram(firstPendingProgram, ProgramRenewalStatus.Available),
          getExpectedProgram(
            secondPendingProgram,
            ProgramRenewalStatus.Available,
          ),
          getExpectedProgram(approvedProgram, ProgramRenewalStatus.Available),
          getExpectedProgram(declinedProgram, ProgramRenewalStatus.Available),
          getExpectedProgram(inactiveProgram, ProgramRenewalStatus.Available),
        ],
      });
  });

  it("Should return only the active programs with the requested status when a status filter is applied.", async () => {
    // Arrange
    const searchCriteria = faker.string.uuid();
    const [pendingProgram] = await Promise.all([
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: {
          name: `Alpha ${searchCriteria}`,
          programStatus: ProgramStatus.Pending,
        },
      }),
      // Approved program that must not be returned.
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: {
          name: `Bravo ${searchCriteria}`,
          programStatus: ProgramStatus.Approved,
        },
      }),
      // Inactive pending program that must not be returned.
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: {
          name: `Charlie ${searchCriteria}`,
          programStatus: ProgramStatus.Pending,
          isActive: false,
        },
      }),
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria,
      statusSearch: ProgramStatus.Pending,
    });

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 1,
        results: [
          getExpectedProgram(pendingProgram, ProgramRenewalStatus.Available),
        ],
      });
  });

  it("Should return only the inactive programs when only the inactive program filter is applied.", async () => {
    // Arrange
    const searchCriteria = faker.string.uuid();
    // Active program that must not be returned.
    await saveEducationProgram(renewableProgramConfiguration, {
      initialValues: { name: `Alpha ${searchCriteria}` },
    });
    const inactiveProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      { initialValues: { name: `Bravo ${searchCriteria}`, isActive: false } },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria,
      inactiveProgramSearch: "true",
      sortField: "programName",
      sortOrder: "ASC",
    });

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 1,
        results: [
          getExpectedProgram(inactiveProgram, ProgramRenewalStatus.Available),
        ],
      });
  });

  [
    {
      scenario: "only the renewed program filter is applied",
      renewalFilters: { renewedProgramSearch: "true" },
      expectRenewed: true,
      expectNotRenewed: false,
    },
    {
      scenario: "only the not renewed program filter is applied",
      renewalFilters: { notRenewedProgramSearch: "true" },
      expectRenewed: false,
      expectNotRenewed: true,
    },
    {
      scenario: "both renewal filters are applied",
      renewalFilters: {
        renewedProgramSearch: "true",
        notRenewedProgramSearch: "true",
      },
      expectRenewed: true,
      expectNotRenewed: true,
    },
  ].forEach(({ scenario, renewalFilters, expectRenewed, expectNotRenewed }) => {
    it(`Should return the programs matching the renewal filters when ${scenario}.`, async () => {
      // Arrange
      const searchCriteria = faker.string.uuid();
      const notRenewedProgram = await saveEducationProgram(
        renewableProgramConfiguration,
        { initialValues: { name: `Alpha ${searchCriteria}` } },
      );
      const renewedProgram = await saveEducationProgram(
        renewableProgramConfiguration,
        { initialValues: { name: `Bravo ${searchCriteria}` } },
      );
      await saveEducationProgram(nextProgramConfiguration, {
        precedingProgram: renewedProgram,
      });
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );
      const expectedResults: EducationProgramManagerDetailsAPIOutDTO[] = [];
      if (expectNotRenewed) {
        expectedResults.push(
          getExpectedProgram(notRenewedProgram, ProgramRenewalStatus.Available),
        );
      }
      if (expectRenewed) {
        expectedResults.push(
          getExpectedProgram(renewedProgram, ProgramRenewalStatus.Renewed),
        );
      }
      const endpoint = getEndpoint(
        renewableProgramConfiguration.programYear.id,
        {
          searchCriteria,
          sortField: "programName",
          sortOrder: "ASC",
          ...renewalFilters,
        },
      );

      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          count: expectedResults.length,
          results: expectedResults,
        });
    });
  });

  it("Should return only the program with the matching SABC code when the search criteria is the SABC code in a different case.", async () => {
    // Arrange
    const sabcCode = "XYZ9";
    const matchingProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      { initialValues: { sabcCode } },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria: sabcCode.toLowerCase(),
    });

    try {
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          count: 1,
          results: [
            getExpectedProgram(matchingProgram, ProgramRenewalStatus.Available),
          ],
        });
    } finally {
      // Remove the fixed SABC code to allow the test to be executed again.
      await db.educationProgram.update(matchingProgram.id, { sabcCode: null });
    }
  });

  it("Should return only the program with the matching CIP code when the search criteria is the CIP code.", async () => {
    // Arrange
    const cipCode = "98.7654";
    const matchingProgram = await saveEducationProgram(
      renewableProgramConfiguration,
      { initialValues: { cipCode } },
    );
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria: cipCode,
    });

    try {
      // Act/Assert
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({
          count: 1,
          results: [
            getExpectedProgram(matchingProgram, ProgramRenewalStatus.Available),
          ],
        });
    } finally {
      // Replace the fixed CIP code to allow the test to be executed again.
      // The CIP code is mandatory, hence the default fake value is used.
      await db.educationProgram.update(matchingProgram.id, {
        cipCode: "cipCode",
      });
    }
  });

  it("Should return the requested page of programs and the total count when the results are paginated.", async () => {
    // Arrange
    const searchCriteria = faker.string.uuid();
    const [secondProgram] = await Promise.all([
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: { name: `Bravo ${searchCriteria}` },
      }),
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: { name: `Alpha ${searchCriteria}` },
      }),
      saveEducationProgram(renewableProgramConfiguration, {
        initialValues: { name: `Charlie ${searchCriteria}` },
      }),
    ]);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(renewableProgramConfiguration.programYear.id, {
      searchCriteria,
      sortField: "programName",
      sortOrder: "ASC",
      page: "1",
      pageLimit: "1",
    });

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({
        count: 3,
        results: [
          getExpectedProgram(secondProgram, ProgramRenewalStatus.Available),
        ],
      });
  });

  it("Should throw not found error when the program year does not exist.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = getEndpoint(999999);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        statusCode: HttpStatus.NOT_FOUND,
        message: "Program year not found.",
        error: "Not Found",
      });
  });

  /**
   * Saves an education program associated with the provided configuration.
   * @param programConfiguration configuration associated with the program.
   * @param options method options.
   * - `initialValues` initial values for the program.
   * - `institution` institution the program belongs to. Defaults to College F.
   * - `auditUser` user creating the program. Defaults to the College F user.
   * - `precedingProgram` program from which the saved program was renewed.
   * @returns the saved education program.
   */
  function saveEducationProgram(
    programConfiguration: EducationProgramConfiguration,
    options?: {
      initialValues?: Partial<EducationProgram>;
      institution?: Institution;
      auditUser?: User;
      precedingProgram?: EducationProgram;
    },
  ): Promise<EducationProgram> {
    const program = createFakeEducationProgram(
      {
        institution: options?.institution ?? collegeF,
        auditUser: options?.auditUser ?? collegeFUser,
        programConfiguration,
      },
      { initialValues: options?.initialValues },
    );
    program.precedingProgram = options?.precedingProgram;
    return db.educationProgram.save(program);
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Gets the expected API result for a saved education program.
 * @param program saved education program.
 * @param renewalStatus expected renewal status.
 * @returns expected API result.
 */
function getExpectedProgram(
  program: EducationProgram,
  renewalStatus: ProgramRenewalStatus,
): EducationProgramManagerDetailsAPIOutDTO {
  return {
    id: program.id,
    name: program.name,
    // Fake programs use a credential type without a display mapping.
    credentialTypeToDisplay: program.credentialType,
    cipCode: program.cipCode,
    sabcCode: program.sabcCode,
    programStatus: program.programStatus,
    isActive: program.isActive,
    renewalStatus,
  };
}

/**
 * Get API endpoint.
 * @param programYearId ID of the program year.
 * @param queryParams optional query parameters, merged with the default
 * pagination parameters (first page with up to 10 records).
 * @returns the API endpoint.
 */
function getEndpoint(
  programYearId: number,
  queryParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    page: "0",
    pageLimit: "10",
    ...queryParams,
  });
  return `/institutions/education-program/program-year/${programYearId}/summary?${params.toString()}`;
}
