import { HttpStatus, INestApplication } from "@nestjs/common";
import {
  EducationProgram,
  FormYesNoOptions,
  Institution,
  NotificationMessageType,
  ProgramIntensity,
  ProgramStatus,
  User,
} from "@sims/sims-db";
import { E2EDataSources, createE2EDataSources } from "@sims/test-utils";
import {
  createTestingAppModule,
  BEARER_AUTH_TYPE,
  InstitutionTokenTypes,
  getInstitutionToken,
  getAuthRelatedEntities,
  createFakeEducationProgram,
} from "../../../../testHelpers";
import request from "supertest";
import { faker } from "@faker-js/faker";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { IsNull } from "typeorm";
import { GC_NOTIFY_TEMPLATE_IDS } from "@sims/test-utils/constants";
import {
  ProgramCourseLoadCalculationTypes,
  ProgramDeliveryTypeValues,
  ProgramESLPercentage,
} from "../../../../services/education-program/education-program.service.models";
import {
  CIP_CODE_REGEX,
  OTHER_REGULATORY_BODY,
  PROGRAM_ENTRANCE_REQUIREMENT_NONE,
} from "../../../../services/education-program/constants";
import { EducationProgramAPIInDTO } from "../../models/education-program.dto";

describe("EducationProgramInstitutionsController(e2e)-createEducationProgram", () => {
  let app: INestApplication;
  let db: E2EDataSources;
  let collegeF: Institution;
  let collegeFUser: User;
  const MINISTRY_EMAIL_ADDRESS = "dummy@some.domain";
  const TEST_SABC_CODE = "GGG9";
  const ENDPOINT = "/institutions/education-program";

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    db = createE2EDataSources(dataSource);
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
    const payload = getPayload();
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(ENDPOINT)
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
    expect(educationProgram).toEqual(
      expect.objectContaining({
        name: payload.name,
        description: payload.description,
        credentialType: payload.credentialType,
        cipCode: payload.cipCode,
        nocCode: payload.nocCode,
        sabcCode: payload.sabcCode,
        regulatoryBody: payload.regulatoryBody,
        otherRegulatoryBody: payload.otherRegulatoryBody,
        deliveredOnSite: true,
        deliveredOnline: false,
        deliveredOnlineAlsoOnsite: null,
        sameOnlineCreditsEarned: null,
        earnAcademicCreditsOtherInstitution: null,
        courseLoadCalculation: payload.courseLoadCalculation,
        completionYears: payload.completionYears,
        eslEligibility: payload.eslEligibility,
        hasJointInstitution: payload.hasJointInstitution,
        hasJointDesignatedInstitution: null,
        programStatus: ProgramStatus.Approved,
        programIntensity: payload.programIntensity,
        institutionProgramCode: payload.institutionProgramCode,
        minHoursWeek: null,
        isAviationProgram: "no",
        minHoursWeekAvi: null,
        hasMinimumAge: true,
        minHighSchool: true,
        requirementsByInstitution: true,
        requirementsByBCITA: true,
        noneOfTheAboveEntranceRequirements: false,
        hasWILComponent: payload.hasWILComponent,
        isWILApproved: null,
        wilProgramEligibility: null,
        hasTravel: payload.hasTravel,
        travelProgramEligibility: null,
        hasIntlExchange: payload.hasIntlExchange,
        intlExchangeProgramEligibility: null,
        programDeclaration: payload.programDeclaration,
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
        isBCPublic: false,
        isBCPrivate: true,
      },
      // BC Private institution user.
      institutionUserType: InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
    },
  ].forEach(({ scenario, scenarioData, institutionUserType }) => {
    it(`Should create an education program in status ${ProgramStatus.Pending} when ${scenario}.`, async () => {
      // Arrange
      const payload = { ...getPayload(), ...scenarioData };
      const institutionUserToken =
        await getInstitutionToken(institutionUserType);

      // Act/Assert
      let educationProgramId: number;
      await request(app.getHttpServer())
        .post(ENDPOINT)
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
    const sabcCode = `${faker.string.alpha({ length: 3, casing: "upper" })}1`;
    const payload = getPayload({ sabcCode });
    // Set program status to pending to trigger creation of pending notification by setting course load calculation to 'hours'.
    payload.courseLoadCalculation = ProgramCourseLoadCalculationTypes.Hours;
    payload.minHoursWeek = FormYesNoOptions.No;
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.CREATED)
      .then((response) => {
        expect(response.body.id).toBeGreaterThan(0);
      });

    const createdNotification = await db.notification.findOne({
      select: { id: true, messagePayload: true },
      where: {
        notificationMessage: {
          id: NotificationMessageType.InstitutionAddsPendingProgramNotification,
        },
        dateSent: IsNull(),
      },
    });
    expect(createdNotification).toBeDefined();
    expect(createdNotification.messagePayload).toStrictEqual({
      email_address: MINISTRY_EMAIL_ADDRESS,
      template_id:
        GC_NOTIFY_TEMPLATE_IDS.InstitutionAddsPendingProgramNotification,
      personalisation: {
        dateTime: expect.any(String),
        institutionName: collegeF.legalOperatingName,
        institutionOperatingName: collegeF.operatingName,
        institutionPrimaryEmail: collegeF.primaryEmail,
        programName: payload.name,
        email: collegeFUser.email,
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
      .post(ENDPOINT)
      .send(getPayload())
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
    const payload = getPayload({ sabcCode: TEST_SABC_CODE });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
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
    const payload = getPayload({ sabcCode: TEST_SABC_CODE });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(ENDPOINT)
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
        sabcCode: payload.sabcCode,
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
    const payload = getPayload({ sabcCode: TEST_SABC_CODE });
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );

    // Act/Assert
    let educationProgramId: number;
    await request(app.getHttpServer())
      .post(ENDPOINT)
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
        sabcCode: payload.sabcCode,
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
      errorMessage: [`cipCode must match ${CIP_CODE_REGEX} regular expression`],
    },
    {
      scenario: "program declaration is not true",
      scenarioData: { programDeclaration: false },
      errorMessage: ["programDeclaration must be equal to true"],
    },
    {
      scenario:
        "international exchange program eligibility is missing for an international program",
      scenarioData: {
        hasIntlExchange: FormYesNoOptions.Yes,
        intlExchangeProgramEligibility: undefined,
      },
      errorMessage: [
        "intlExchangeProgramEligibility must be one of the following values: yes, no",
      ],
    },
    {
      scenario:
        "aviation credential type is provided for a non-aviation program",
      scenarioData: {
        isAviationProgram: FormYesNoOptions.No,
        credentialTypesAviation: ["privatePilotTraining"],
      },
      errorMessage: ["credentialTypesAviation input is not allowed."],
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
      errorMessage:
        "None of the above entrance requirement cannot be provided along with other entrance requirements.",
    },
    {
      scenario: "invalid lookup values are provided",
      scenarioData: {
        credentialType: "invalidCredentialType",
        completionYears: "invalidProgramLength",
        entranceRequirements: ["invalidEntranceRequirement"],
        regulatoryBody: "invalidRegulatoryBody",
        otherRegulatoryBody: undefined,
        isAviationProgram: FormYesNoOptions.Yes,
        minHoursWeekAvi: FormYesNoOptions.Yes,
        credentialTypesAviation: ["invalidAviationCredential"],
      },
      errorMessage:
        "Invalid values for the following lookup fields: Program credential type: invalidCredentialType," +
        " Program length: invalidProgramLength," +
        " Entrance requirements: invalidEntranceRequirement," +
        " Regulatory body: invalidRegulatoryBody, Aviation credentials: invalidAviationCredential.",
    },
  ].forEach(({ scenario, scenarioData, errorMessage }) => {
    it(`Should throw bad request error when ${scenario}.`, async () => {
      // Arrange
      const payload = { ...getPayload(), ...scenarioData };
      const institutionUserToken = await getInstitutionToken(
        InstitutionTokenTypes.CollegeFUser,
      );

      // Act/Assert
      await request(app.getHttpServer())
        .post(ENDPOINT)
        .send(payload)
        .auth(institutionUserToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.BAD_REQUEST)
        .expect({
          message: errorMessage,
          error: "Bad Request",
          statusCode: HttpStatus.BAD_REQUEST,
        });
    });
  });

  // Test unprocessable entity errors.
  it(`Should unprocessable entity error when BC Private and BC Public status does not match with the institution type.`, async () => {
    // Arrange
    const payload = { ...getPayload(), isBCPrivate: false, isBCPublic: true };
    // BC Private institution user.
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeCAdminLegalSigningUser,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .post(ENDPOINT)
      .send(payload)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "The provided BC Public and BC Private status does not match the actual institution type.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
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
        user: collegeFUser,
      },
      {
        initialValue: {
          sabcCode,
          isActive,
          effectiveEndDate,
        } as Partial<EducationProgram>,
      },
    );
    return db.educationProgram.save(educationProgram);
  }

  /**
   * Returns a payload with the passed sabcCode.
   * @param options options to customize the payload
   * - `sabcCode` SABC code.
   */
  function getPayload(options?: {
    sabcCode?: string;
  }): EducationProgramAPIInDTO {
    return {
      name: faker.lorem.words(5),
      description: faker.lorem.words(5),
      credentialType: "undergraduateCertificate",
      cipCode: "11.1111",
      nocCode: "21740",
      sabcCode:
        options?.sabcCode ??
        `${faker.string.alpha({ length: 3, casing: "upper" })}1`,
      institutionProgramCode: faker.string.alpha({
        length: 3,
        casing: "upper",
      }),
      programIntensity: ProgramIntensity.fullTimePartTime,
      programDeliveryTypes: [ProgramDeliveryTypeValues.Onsite],
      completionYears: "12WeeksTo52Weeks",
      courseLoadCalculation: ProgramCourseLoadCalculationTypes.Credit,
      regulatoryBody: OTHER_REGULATORY_BODY,
      otherRegulatoryBody: "Other RB test",
      entranceRequirements: [
        "minHighSchool",
        "hasMinimumAge",
        "requirementsByInstitution",
        "requirementsByBCITA",
      ],
      isAviationProgram: FormYesNoOptions.No,
      eslEligibility: ProgramESLPercentage.LessThan20,
      hasJointInstitution: FormYesNoOptions.No,
      hasWILComponent: FormYesNoOptions.No,
      hasTravel: FormYesNoOptions.No,
      hasIntlExchange: FormYesNoOptions.No,
      programDeclaration: true,
      isBCPublic: true,
      isBCPrivate: false,
    };
  }

  afterAll(async () => {
    await app?.close();
  });
});
