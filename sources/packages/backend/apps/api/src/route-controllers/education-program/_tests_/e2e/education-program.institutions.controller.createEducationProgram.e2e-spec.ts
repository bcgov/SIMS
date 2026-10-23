import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  EducationProgramConfiguration,
  FormYesNoOptions,
  Institution,
  NotificationMessageType,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeEducationProgram,
  getMostRecentEducationProgramConfiguration,
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
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { IsNull } from "typeorm";
import {
  GC_NOTIFY_TEMPLATE_IDS,
  NOTIFY_TEMPLATE_IDS,
} from "@sims/test-utils/constants";
import { PROGRAM_ENTRANCE_REQUIREMENT_NONE } from "../../../../services/education-program/constants";
import {
  ProgramESLPercentage,
  ProgramDeliveryTypeValues,
  ProgramCourseLoadCalculationTypes,
} from "../../../../services/education-program/education-program.service.models";
import { getCreationPayload } from "./education-program.utils";

describe("EducationProgramInstitutionsController(e2e)-createEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  let mostRecentProgramConfiguration: EducationProgramConfiguration;
  const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";
  const TEST_SABC_CODE = "GGG9";

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
    collegeFUser = institutionUser;

    // Update fake email contacts to send ministry notifications.
    await db.notificationMessage.update(
      {
        id: NotificationMessageType.InstitutionAddsPendingProgramNotification,
      },
      { emailContacts: [MINISTRY_EMAIL_ADDRESS] },
    );
  });

  beforeEach(async () => {
    // Mark all existing pending program notifications as sent to isolate test assertions.
    await db.notification.update(
      {
        notificationMessage: {
          id: NotificationMessageType.InstitutionAddsPendingProgramNotification,
        },
      },
      { dateSent: new Date() },
    );
    // Reset the SABC Code to avoid data conflicts.
    await db.educationProgram.update(
      {
        sabcCode: TEST_SABC_CODE,
      },
      { sabcCode: null },
    );
  });

  it("Should create an education program when valid data is passed.", async () => {
    // Arrange
    const payload = getCreationPayload(mostRecentProgramConfiguration.id);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramId = response.body.id;
      });

    const educationProgram = await db.educationProgram.findOne({
      select: {
        id: true,
        name: true,
        description: true,
        credentialType: true,
        cipCode: true,
        nocCode: true,
        sabcCode: true,
        regulatoryBody: true,
        otherRegulatoryBody: true,
        deliveredOnSite: true,
        deliveredOnline: true,
        deliveredOnlineAlsoOnsite: true,
        sameOnlineCreditsEarned: true,
        earnAcademicCreditsOtherInstitution: true,
        courseLoadCalculation: true,
        completionYears: true,
        eslEligibility: true,
        hasJointInstitution: true,
        hasJointDesignatedInstitution: true,
        programStatus: true,
        programIntensity: true,
        institutionProgramCode: true,
        minHoursWeek: true,
        isAviationProgram: true,
        minHoursWeekAvi: true,
        hasMinimumAge: true,
        minHighSchool: true,
        requirementsByInstitution: true,
        hasWILComponent: true,
        isWILApproved: true,
        wilProgramEligibility: true,
        hasTravel: true,
        travelProgramEligibility: true,
        hasIntlExchange: true,
        intlExchangeProgramEligibility: true,
        programDeclaration: true,
        assessedDate: true,
        effectiveEndDate: true,
        fieldOfStudyCode: true,
        requirementsByBCITA: true,
        noneOfTheAboveEntranceRequirements: true,
        isActive: true,
        programData: true,
        programConfiguration: {
          id: true,
        },
        institution: {
          id: true,
        },
        submittedBy: {
          id: true,
        },
      },
      where: { id: educationProgramId },
      relations: {
        institution: true,
        submittedBy: true,
      },
    });
    const { programData } = payload;
    // Field of study code is calculated and added to the persisted program data.
    expect(educationProgram.programData).toEqual(programData);
    expect(educationProgram).toEqual(
      expect.objectContaining({
        name: programData.programName,
        description: programData.programDescription,
        credentialType: programData.credentialType,
        cipCode: programData.cipCode,
        nocCode: programData.nocCode,
        sabcCode: programData.sabcCode,
        regulatoryBody: programData.regulatoryBody,
        otherRegulatoryBody: programData.otherRegulatoryBody,
        deliveredOnSite: true,
        deliveredOnline: false,
        deliveredOnlineAlsoOnsite: null,
        sameOnlineCreditsEarned: null,
        earnAcademicCreditsOtherInstitution: null,
        courseLoadCalculation: programData.courseLoadCalculation,
        completionYears: programData.completionYears,
        eslEligibility: programData.eslEligibility,
        hasJointInstitution: programData.hasJointInstitution,
        hasJointDesignatedInstitution: null,
        programStatus: ProgramStatus.Approved,
        programIntensity: programData.programIntensity,
        institutionProgramCode: programData.institutionProgramCode,
        minHoursWeek: null,
        isAviationProgram: "no",
        minHoursWeekAvi: null,
        hasMinimumAge: true,
        minHighSchool: true,
        requirementsByInstitution: true,
        requirementsByBCITA: true,
        noneOfTheAboveEntranceRequirements: false,
        hasWILComponent: programData.hasWILComponent,
        isWILApproved: null,
        wilProgramEligibility: null,
        hasTravel: programData.hasTravel,
        travelProgramEligibility: null,
        hasIntlExchange: programData.hasIntlExchange,
        intlExchangeProgramEligibility: null,
        programDeclaration: programData.programDeclaration,
        assessedDate: null,
        effectiveEndDate: null,
        fieldOfStudyCode: 15,
        institution: {
          id: collegeF.id,
        },
        submittedBy: { id: collegeFUser.id },
        isActive: true,
        isExpired: false,
      }),
    );
  });

  // Test programs created in pending status.
  [
    {
      scenario: "program is offered jointly or in partnership",
      scenarioData: {
        hasJointInstitution: FormYesNoOptions.Yes,
        hasJointDesignatedInstitution: FormYesNoOptions.Yes,
      },
      institutionUserType: InstitutionTokenTypes.CollegeFUser,
    },
    {
      scenario: "program has more than 20 percent ESL Content",
      scenarioData: { eslEligibility: ProgramESLPercentage.GreaterThanEqual20 },
      institutionUserType: InstitutionTokenTypes.CollegeFUser,
    },
    {
      scenario: "program has no entrance requirements",
      scenarioData: {
        entranceRequirements: [PROGRAM_ENTRANCE_REQUIREMENT_NONE],
      },
      institutionUserType: InstitutionTokenTypes.CollegeFUser,
    },
    {
      scenario:
        "program belongs to BC Private institution and delivered only online",
      scenarioData: {
        programDeliveryTypes: [ProgramDeliveryTypeValues.Online],
      },
      // BC Private institution user.
      institutionUserType: InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
    },
  ].forEach(({ scenario, scenarioData, institutionUserType }) => {
    it(`Should create an education program in status ${ProgramStatus.Pending} when ${scenario}.`, async () => {
      // Arrange
      const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
        appendedProgramData: scenarioData,
      });
      const institutionUserToken =
        await getInstitutionToken(institutionUserType);

      // Act/Assert
      let educationProgramId: number;
      await request(app.getHttpServer())
        .post(getEndpoint())
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then(({ body }) => {
          expect(body.id).toBeGreaterThan(0);
          educationProgramId = body.id;
        });
      // Validate status of the created education program in the database.
      const createdProgram = await db.educationProgram.findOne({
        select: { id: true, programStatus: true },
        where: { id: educationProgramId },
      });
      expect(createdProgram).toEqual({
        id: educationProgramId,
        programStatus: ProgramStatus.Pending,
      });
    });
  });

  it("Should create an education program pending notification when the program is pending.", async () => {
    // Arrange
    const programName = faker.lorem.words(5);
    const sabcCode = `${faker.string.alpha({ length: 3, casing: "upper" })}1`;
    const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
      appendedProgramData: {
        programName,
        sabcCode,
        courseLoadCalculation: ProgramCourseLoadCalculationTypes.Hours,
        minHoursWeek: FormYesNoOptions.No,
      },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });

    const createdNotification = await db.notification.findOne({
      select: {
        id: true,
        messagePayload: true,
        templateId: true,
        recipients: true,
        messageContent: true,
      },
      where: {
        notificationMessage: {
          id: NotificationMessageType.InstitutionAddsPendingProgramNotification,
        },
        dateSent: IsNull(),
      },
    });
    expect(createdNotification).toBeDefined();
    expect(createdNotification).toEqual({
      id: expect.any(Number),
      messagePayload: {
        email_address: MINISTRY_EMAIL_ADDRESS,
        template_id:
          GC_NOTIFY_TEMPLATE_IDS.InstitutionAddsPendingProgramNotification,
        personalisation: {
          dateTime: expect.any(String),
          institutionName: collegeF.legalOperatingName,
          institutionOperatingName: collegeF.operatingName,
          institutionPrimaryEmail: collegeF.primaryEmail,
          programName: programName,
          email: collegeFUser.email,
        },
      },
      templateId: NOTIFY_TEMPLATE_IDS.InstitutionAddsPendingProgramNotification,
      recipients: [MINISTRY_EMAIL_ADDRESS],
      messageContent: {
        params: {
          dateTime: expect.any(String),
          institutionName: collegeF.legalOperatingName,
          institutionOperatingName: collegeF.operatingName,
          institutionPrimaryEmail: collegeF.primaryEmail,
          programName: programName,
          email: collegeFUser.email,
        },
      },
    });
  });

  it("Should not create an education program when user is read-only.", async () => {
    // Arrange
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeEReadOnlyUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(getCreationPayload(mostRecentProgramConfiguration.id))
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        statusCode: HttpStatus.FORBIDDEN,
        message: "You are not authorized to create or modify a program.",
        error: "Forbidden",
      });
  });

  it("Should throw duplicate SABC code for education program when there is already an active education program with the same SABC code.", async () => {
    // Arrange
    await saveEducationProgram(TEST_SABC_CODE);
    const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
      appendedProgramData: { sabcCode: TEST_SABC_CODE },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        errorType: "DUPLICATE_SABC_CODE",
        message: "Duplicate SABC code.",
      });
  });

  it("Should create an education program when SABC code passed exists for an expired education program.", async () => {
    // Arrange
    await saveEducationProgram(
      TEST_SABC_CODE,
      true,
      getISODateOnlyString(new Date()),
    );
    const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
      appendedProgramData: { sabcCode: TEST_SABC_CODE },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramId = response.body.id;
      });

    const educationProgram = await db.educationProgram.findOne({
      where: { id: educationProgramId },
    });
    expect(educationProgram).toEqual(
      expect.objectContaining({
        sabcCode: TEST_SABC_CODE,
      }),
    );
  });

  it("Should create an education program when SABC code passed exists for an education program flagged as inactive.", async () => {
    // Arrange
    await saveEducationProgram(
      TEST_SABC_CODE,
      false,
      getISODateOnlyString(addDays(1)),
    );
    const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
      appendedProgramData: { sabcCode: TEST_SABC_CODE },
    });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(getEndpoint())
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        educationProgramId = response.body.id;
      });

    const educationProgram = await db.educationProgram.findOne({
      where: { id: educationProgramId },
    });
    expect(educationProgram).toEqual(
      expect.objectContaining({
        sabcCode: TEST_SABC_CODE,
      }),
    );
  });

  // Test bad request data.
  [
    {
      scenario: "CIP code format is invalid",
      scenarioData: {
        cipCode: "12",
      },
      errorMessage: [String.raw`/cipCode must match pattern "^\d{2}\.\d{4}$"`],
    },
    {
      scenario: "program declaration is not true",
      scenarioData: { programDeclaration: false },
      errorMessage: ["/programDeclaration must be equal to constant: true"],
    },
    {
      scenario:
        "international exchange program eligibility is missing for an international program",
      scenarioData: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: undefined,
      },
      errorMessage: [
        "must have required property 'intlExchangeProgramEligibility'",
      ],
    },
    {
      scenario:
        "aviation credential type is provided for a non-aviation program",
      scenarioData: {
        isAviationProgram: FormYesNoOptions.No,
        credentialTypesAviation: ["privatePilotTraining"],
      },
      errorMessage: ["/credentialTypesAviation must not be present"],
    },
    {
      scenario:
        "none of the entrance requirements is provided along with other entrance requirements",
      scenarioData: {
        entranceRequirements: [
          PROGRAM_ENTRANCE_REQUIREMENT_NONE,
          "minHighSchool",
        ],
      },
      errorMessage: ["/entranceRequirements must NOT have more than 1 items"],
    },
    {
      scenario: "invalid lookup values are provided (credentialType)",
      scenarioData: {
        credentialType: "invalidCredentialType",
      },
      errorMessage: [
        '/credentialType must be equal to constant: "undergraduateCertificate"',
        '/credentialType must be equal to constant: "undergraduateCitation"',
        '/credentialType must be equal to constant: "undergraduateDiploma"',
        '/credentialType must be equal to constant: "undergraduateDegree"',
        '/credentialType must be equal to constant: "graduateCertificate"',
        '/credentialType must be equal to constant: "graduateDiploma"',
        '/credentialType must be equal to constant: "graduateDegreeOrMasters"',
        '/credentialType must be equal to constant: "postGraduateOrDoctorate"',
        '/credentialType must be equal to constant: "qualifyingStudies"',
        "/credentialType must match exactly one schema in oneOf",
      ],
    },
    {
      scenario: "invalid lookup values are provided (completionYears)",
      scenarioData: {
        completionYears: "invalidCompletionYears",
      },
      errorMessage: [
        '/completionYears must be equal to constant: "12WeeksTo52Weeks"',
        '/completionYears must be equal to constant: "53WeeksTo59Weeks"',
        '/completionYears must be equal to constant: "60WeeksToLessThan2Years"',
        '/completionYears must be equal to constant: "2YearsToLessThan3Years"',
        '/completionYears must be equal to constant: "3YearsToLessThan4Years"',
        '/completionYears must be equal to constant: "4YearsToLessThan5Years"',
        '/completionYears must be equal to constant: "5YearsOrMore"',
        "/completionYears must match exactly one schema in oneOf",
      ],
    },
    {
      scenario: "invalid lookup values are provided (entranceRequirements)",
      scenarioData: {
        entranceRequirements: ["invalidEntranceRequirements"],
      },
      errorMessage: [
        '/entranceRequirements/0 must be equal to constant: "minHighSchool"',
        '/entranceRequirements/0 must be equal to constant: "hasMinimumAge"',
        '/entranceRequirements/0 must be equal to constant: "requirementsByInstitution"',
        '/entranceRequirements/0 must be equal to constant: "requirementsByBCITA"',
        '/entranceRequirements/0 must be equal to constant: "noneOfTheAboveEntranceRequirements"',
        "/entranceRequirements/0 must match exactly one schema in oneOf",
      ],
    },
    {
      scenario: "invalid lookup values are provided (regulatoryBody)",
      scenarioData: {
        regulatoryBody: ["invalidRegulatoryBody"],
      },
      errorMessage: [
        '/regulatoryBody must be equal to constant: "ptiru"',
        '/regulatoryBody must be equal to constant: "dqab"',
        '/regulatoryBody must be equal to constant: "privateActLegislature"',
        '/regulatoryBody must be equal to constant: "skilledTradesBC"',
        '/regulatoryBody must be equal to constant: "icbc"',
        '/regulatoryBody must be equal to constant: "senateOrEducationCouncil"',
        '/regulatoryBody must be equal to constant: "other"',
        "/regulatoryBody must match exactly one schema in oneOf",
      ],
    },
    {
      scenario: "invalid lookup values are provided (credentialTypesAviation)",
      scenarioData: {
        isAviationProgram: FormYesNoOptions.Yes,
        minHoursWeekAvi: FormYesNoOptions.Yes,
        credentialTypesAviation: ["invalidAviationCredential"],
      },
      errorMessage: [
        '/credentialTypesAviation/0 must be equal to constant: "commercialPilotTraining"',
        '/credentialTypesAviation/0 must be equal to constant: "instructorsRating"',
        '/credentialTypesAviation/0 must be equal to constant: "endorsements"',
        '/credentialTypesAviation/0 must be equal to constant: "privatePilotTraining"',
        "/credentialTypesAviation/0 must match exactly one schema in oneOf",
      ],
    },
  ].forEach(({ scenario, scenarioData, errorMessage }) => {
    it(`Should throw bad request error when ${scenario}.`, async () => {
      // Arrange
      const payload = getCreationPayload(mostRecentProgramConfiguration.id, {
        appendedProgramData: scenarioData,
      });
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(getEndpoint())
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: errorMessage,
          error: "Education program data is not valid.",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });
  });

  /**
   * Saves an education program with parameters.
   * @param sabcCode SABC code.
   * @param isActive is active flag.
   * @param effectiveEndDate effective end date.
   * @returns an education program.
   */
  async function saveEducationProgram(
    sabcCode: string,
    isActive?: boolean,
    effectiveEndDate?: string,
  ): Promise<EducationProgram> {
    const educationProgram = createFakeEducationProgram(
      {
        institution: collegeF,
        auditUser: collegeFUser,
        programConfiguration: mostRecentProgramConfiguration,
      },
      {
        initialValues: {
          sabcCode,
          isActive,
          effectiveEndDate,
        } as Partial<EducationProgram>,
      },
    );
    return db.educationProgram.save(educationProgram);
  }

  afterAll(async () => {
    await app?.close();
  });
});

/**
 * Get API endpoint.
 * @returns the API endpoint.
 */
function getEndpoint(): string {
  return "/institutions/education-program";
}
