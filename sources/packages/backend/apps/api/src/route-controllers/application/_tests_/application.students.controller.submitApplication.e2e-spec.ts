import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../testHelpers";
import {
  createE2EDataSources,
  E2EDataSources,
  saveFakeApplication,
  getProviderInstanceForModule,
  createFakeEducationProgramOffering,
  createFakeUser,
  saveFakeStudent,
  saveFakeSFASIndividual,
  RestrictionCode,
  ensureProgramYearExistsForPartTimeOnly,
} from "@sims/test-utils";
import {
  Application,
  ApplicationData,
  ApplicationStatus,
  EducationProgramOffering,
  OfferingIntensity,
  ProgramYear,
  Student,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { SaveApplicationAPIInDTO } from "../models/application.dto";
import { FormNames, FormService } from "../../../services";
import { AppStudentsModule } from "../../../app.students.module";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";
import { ConfigService } from "@sims/utilities/config";

describe("ApplicationStudentsController(e2e)-submitApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let db: E2EDataSources;
  let formService: FormService;
  let recentActiveProgramYear: ProgramYear;
  let configService: ConfigService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    configService = appModule.get(ConfigService);
    // Program Year for the following tests.
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    recentActiveProgramYear = await db.programYear.findOne({
      select: { id: true, startDate: true, endDate: true },
      where: { active: true },
      order: { startDate: "DESC" },
    });
    // To check the study dates overlap error, the BYPASS_APPLICATION_SUBMIT_VALIDATIONS needs to be set false.
    process.env.BYPASS_APPLICATION_SUBMIT_VALIDATIONS = "false";
  });

  beforeEach(() => {
    resetMockJWTUserInfo(appModule);
    allowBetaUsersOnly(false);
  });

  it("Should throw study dates overlap error when an application submitted for a student via the SIMS system has overlapping study start or study end dates with another application.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // First offering created with start date 10 days prior to the
    // current date and end date 10 days after the current date.
    const firstApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(-10)),
      studyEndDate: getISODateOnlyString(addDays(10)),
      offeringIntensity: OfferingIntensity.partTime,
    } as EducationProgramOffering;
    await saveFakeApplication(
      appDataSource,
      {
        student,
      },
      {
        offeringInitialValues: firstApplicationOfferingInitialValues,
      },
    );
    // Second offering created with start date as the current
    // date and the end date 20 days after the current date.
    // This will result in the offering start date of this offering
    // overlap with the first offering's start and end dates.
    const secondApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(new Date()),
      studyEndDate: getISODateOnlyString(addDays(20)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const secondDraftApplication = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
        offeringInitialValues: {
          offeringIntensity:
            secondApplicationOfferingInitialValues.offeringIntensity,
        },
      },
    );
    const auditUser = await db.user.save(createFakeUser());
    const secondApplicationOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation: secondDraftApplication.location,
        },
        {
          initialValues: secondApplicationOfferingInitialValues,
        },
      ),
    );
    const secondApplicationProgram = secondApplicationOffering.educationProgram;
    const applicationData = {
      selectedOfferingDate:
        secondApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        secondApplicationOfferingInitialValues.studyEndDate,
      howWillYouBeAttendingTheProgram:
        secondApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: secondApplicationProgram.id,
      selectedOffering: secondApplicationOffering.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: secondDraftApplication.programYear.id,
    } as SaveApplicationAPIInDTO;
    const endpoint = `/students/application/${secondDraftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: applicationData },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study dates or a pending program information request. Please contact your institution for further assistance.",
        errorType: "STUDY_DATE_OVERLAP_ERROR",
      });
  });

  it("Should throw study dates overlap error when a part-time application submitted for a student via the SFAS system has overlapping study start or study end dates with another application.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        student,
      },
    });
    // First offering created with start date 30 days after the
    // current date and end date 50 days after the current date.
    const firstFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(30)),
          endDate: getISODateOnlyString(addDays(50)),
        },
      },
    );
    await db.sfasPartTimeApplications.save(firstFakeSFASPartTimeApplication);
    // Create a fake offering for the second application.
    const auditUser = await db.user.save(createFakeUser());
    // Second offering created with start date 40 days after the
    // current date and the end date 60 days after the current date.
    // This will result in the offering start date of this offering
    // overlap with the first offering's start and end dates.
    const secondApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(40)),
      studyEndDate: getISODateOnlyString(addDays(60)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const fakeOffering = createFakeEducationProgramOffering(
      {
        auditUser,
      },
      {
        initialValues: secondApplicationOfferingInitialValues,
      },
    );
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const secondDraftApplication = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
        offeringInitialValues: {
          offeringIntensity:
            secondApplicationOfferingInitialValues.offeringIntensity,
        },
      },
    );
    const applicationData = {
      selectedOfferingDate:
        secondApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        secondApplicationOfferingInitialValues.studyEndDate,
      howWillYouBeAttendingTheProgram:
        secondApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: savedOffering.educationProgram.id,
      selectedOffering: savedOffering.id,
      selectedLocation: savedOffering.institutionLocation.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: secondDraftApplication.programYear.id,
    } as SaveApplicationAPIInDTO;
    const endpoint = `/students/application/${secondDraftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: applicationData },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study dates or a pending program information request. Please contact your institution for further assistance.",
        errorType: "STUDY_DATE_OVERLAP_ERROR",
      });
  });

  it("Should throw study dates overlap error when a full-time application is submitted for a student via the SFAS system has overlapping study start or study end dates with another application.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        student,
      },
    });

    const sfasFullTimeApplication = createFakeSFASApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(new Date()),
          endDate: getISODateOnlyString(addDays(50)),
        },
      },
    );
    await db.sfasApplication.save(sfasFullTimeApplication);
    // Create a fake offering for the second application.
    const auditUser = await db.user.save(createFakeUser());

    // SIMS Offering having overlapping study period with SFAS.
    const simsApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(40)),
      studyEndDate: getISODateOnlyString(addDays(90)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const fakeOffering = createFakeEducationProgramOffering(
      {
        auditUser,
      },
      {
        initialValues: simsApplicationOfferingInitialValues,
      },
    );
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const secondDraftApplication = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
      },
    );
    const applicationData = {
      selectedOfferingDate: simsApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        simsApplicationOfferingInitialValues.studyEndDate,
      howWillYouBeAttendingTheProgram:
        simsApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: savedOffering.educationProgram.id,
      selectedOffering: savedOffering.id,
      selectedLocation: savedOffering.institutionLocation.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: secondDraftApplication.programYear.id,
    } as SaveApplicationAPIInDTO;
    const endpoint = `/students/application/${secondDraftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: applicationData },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study dates or a pending program information request. Please contact your institution for further assistance.",
        errorType: "STUDY_DATE_OVERLAP_ERROR",
      });
  });

  it("Should submit an application for a student when the application study dates do not have any overlap with the study dates of any existing application.", async () => {
    // Arrange
    const student = await saveFakeStudent(db.dataSource);
    // First offering created with start date 70 days after the
    // current date and end date 90 days after the current date.
    const firstApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(70)),
      studyEndDate: getISODateOnlyString(addDays(90)),
      offeringIntensity: OfferingIntensity.partTime,
    } as EducationProgramOffering;
    await saveFakeApplication(
      appDataSource,
      {
        student,
      },
      { offeringInitialValues: firstApplicationOfferingInitialValues },
    );
    // Second offering created with start date 91 days after the
    // current date and the end date 99 days after the current date.
    // This will ensure that there are no date overlaps between the
    // first and the second offerings.
    const secondApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(91)),
      studyEndDate: getISODateOnlyString(addDays(99)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const secondDraftApplication = await saveFakeApplication(
      db.dataSource,
      { student },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
        offeringInitialValues: {
          offeringIntensity:
            secondApplicationOfferingInitialValues.offeringIntensity,
        },
      },
    );
    const auditUser = await db.user.save(createFakeUser());
    const secondApplicationOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        {
          auditUser,
          institutionLocation: secondDraftApplication.location,
        },
        {
          initialValues: secondApplicationOfferingInitialValues,
        },
      ),
    );
    const secondApplicationProgram = secondApplicationOffering.educationProgram;
    const applicationData = {
      selectedOfferingDate:
        secondApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        secondApplicationOfferingInitialValues.studyEndDate,
      howWillYouBeAttendingTheProgram:
        secondApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: secondApplicationProgram.id,
      selectedOffering: secondApplicationOffering.id,
      selectedLocation: secondApplicationOffering.institutionLocation.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: secondDraftApplication.programYear.id,
    } as SaveApplicationAPIInDTO;
    const endpoint = `/students/application/${secondDraftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: applicationData },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});
  });

  it(
    "Should submit an application for a student when there is a cancelled full-time application in SFAS with overlapping study dates" +
      " ignoring the cancelled SFAS application.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { student },
      });
      // Cancelled SFAS full time application with overlapping study dates.
      const sfasFullTimeApplication = createFakeSFASApplication(
        { individual: sfasIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(new Date()),
            endDate: getISODateOnlyString(addDays(50)),
            // The SFAS application is cancelled.
            applicationCancelDate: getISODateOnlyString(new Date()),
          },
        },
      );
      await db.sfasApplication.save(sfasFullTimeApplication);

      // SIMS Offering having overlapping study period with SFAS.
      const simsApplicationOfferingInitialValues = {
        studyStartDate: getISODateOnlyString(addDays(30)),
        studyEndDate: getISODateOnlyString(addDays(90)),
        offeringIntensity: OfferingIntensity.partTime,
      };
      const simsDraftApplication = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationData: {} as ApplicationData,
          applicationStatus: ApplicationStatus.Draft,
          offeringInitialValues: {
            offeringIntensity:
              simsApplicationOfferingInitialValues.offeringIntensity,
          },
        },
      );
      const auditUser = await db.user.save(createFakeUser());
      const simsApplicationOffering = await db.educationProgramOffering.save(
        createFakeEducationProgramOffering(
          {
            auditUser,
            institutionLocation: simsDraftApplication.location,
          },
          {
            initialValues: simsApplicationOfferingInitialValues,
          },
        ),
      );
      const secondApplicationProgram = simsApplicationOffering.educationProgram;
      const applicationData = {
        selectedOfferingDate:
          simsApplicationOfferingInitialValues.studyStartDate,
        selectedOfferingEndDate:
          simsApplicationOfferingInitialValues.studyEndDate,
        howWillYouBeAttendingTheProgram:
          simsApplicationOfferingInitialValues.offeringIntensity,
        selectedProgram: secondApplicationProgram.id,
        selectedOffering: simsApplicationOffering.id,
        selectedLocation: simsApplicationOffering.institutionLocation.id,
      };
      const payload = {
        associatedFiles: [],
        data: applicationData,
        programYearId: simsDraftApplication.programYear.id,
      } as SaveApplicationAPIInDTO;
      const endpoint = `/students/application/${simsDraftApplication.id}/submit`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.Application,
        data: { data: applicationData },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});
    },
  );

  it(
    "Should submit an application for a student when there is a cancelled part-time application in SFAS with overlapping study dates" +
      " ignoring the cancelled SFAS application.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
        initialValues: { student },
      });
      // Cancelled SFAS full time application with overlapping study dates.
      const sfasPartTimeApplication = createFakeSFASPartTimeApplication(
        { individual: sfasIndividual },
        {
          initialValues: {
            startDate: getISODateOnlyString(new Date()),
            endDate: getISODateOnlyString(addDays(50)),
            // The SFAS application is cancelled.
            applicationCancelDate: getISODateOnlyString(new Date()),
          },
        },
      );
      await db.sfasPartTimeApplications.save(sfasPartTimeApplication);

      // SIMS Offering having overlapping study period with SFAS.
      const simsApplicationOfferingInitialValues = {
        studyStartDate: getISODateOnlyString(addDays(30)),
        studyEndDate: getISODateOnlyString(addDays(90)),
        offeringIntensity: OfferingIntensity.partTime,
      };
      const simsDraftApplication = await saveFakeApplication(
        db.dataSource,
        { student },
        {
          applicationData: {} as ApplicationData,
          applicationStatus: ApplicationStatus.Draft,
          offeringInitialValues: {
            offeringIntensity:
              simsApplicationOfferingInitialValues.offeringIntensity,
          },
        },
      );
      const auditUser = await db.user.save(createFakeUser());
      const simsApplicationOffering = await db.educationProgramOffering.save(
        createFakeEducationProgramOffering(
          {
            auditUser,
            institutionLocation: simsDraftApplication.location,
          },
          {
            initialValues: simsApplicationOfferingInitialValues,
          },
        ),
      );
      const secondApplicationProgram = simsApplicationOffering.educationProgram;
      const applicationData = {
        selectedOfferingDate:
          simsApplicationOfferingInitialValues.studyStartDate,
        selectedOfferingEndDate:
          simsApplicationOfferingInitialValues.studyEndDate,
        howWillYouBeAttendingTheProgram:
          simsApplicationOfferingInitialValues.offeringIntensity,
        selectedProgram: secondApplicationProgram.id,
        selectedOffering: simsApplicationOffering.id,
        selectedLocation: simsApplicationOffering.institutionLocation.id,
      };
      const payload = {
        associatedFiles: [],
        data: applicationData,
        programYearId: simsDraftApplication.programYear.id,
      } as SaveApplicationAPIInDTO;
      const endpoint = `/students/application/${simsDraftApplication.id}/submit`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.Application,
        data: { data: applicationData },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});
    },
  );

  it("Should submit an application for a student when the program year is the most recent active program year and offering intensity is Part-time.", async () => {
    // Arrange
    // Create a student and a draft application.
    const student = await saveFakeStudent(db.dataSource);
    const draftApplication = await saveFakeApplication(
      db.dataSource,
      { student, programYear: recentActiveProgramYear },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
        offeringIntensity: OfferingIntensity.partTime,
      },
    );
    // Create an offering.
    const selectedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        {
          auditUser: student.user,
          institutionLocation: draftApplication.location,
        },
        {
          initialValues: {
            studyStartDate: getISODateOnlyString(
              addDays(1, recentActiveProgramYear.startDate),
            ),
            offeringIntensity: OfferingIntensity.partTime,
          },
        },
      ),
    );
    const selectedProgram = selectedOffering.educationProgram;
    const applicationData = {
      selectedOfferingDate: selectedOffering.studyStartDate,
      selectedOfferingEndDate: selectedOffering.studyEndDate,
      selectedProgram: selectedProgram.id,
      selectedOffering: selectedOffering.id,
      selectedLocation: selectedOffering.institutionLocation.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: recentActiveProgramYear.id,
    } as SaveApplicationAPIInDTO;
    const endpoint = `/students/application/${draftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: applicationData },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect({});
  });

  it(
    "Should submit an application for a student and add an E2 restriction when the application data includes " +
      "the E2 restriction code and the student does not have an active E2 or RB restriction.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);
      // Create a draft application.
      const draftApplication = await saveFakeApplication(
        db.dataSource,
        { student, programYear: recentActiveProgramYear },
        {
          applicationData: {} as ApplicationData,
          applicationStatus: ApplicationStatus.Draft,
          offeringIntensity: OfferingIntensity.partTime,
        },
      );
      // Create an offering to be submitted.
      const offering = await db.educationProgramOffering.save(
        createFakeEducationProgramOffering(
          {
            auditUser: student.user,
            institutionLocation: draftApplication.location,
          },
          {
            initialValues: {
              offeringIntensity: OfferingIntensity.partTime,
            },
          },
        ),
      );
      // Create an application with the E2 restriction code.
      const applicationData = {
        selectedOfferingDate: offering.studyStartDate,
        selectedOfferingEndDate: offering.studyEndDate,
        selectedProgram: offering.educationProgram.id,
        selectedOffering: offering.id,
        selectedLocation: offering.institutionLocation.id,
        // Include the E2 restriction code in the application data
        restrictions: [RestrictionCode.E2],
      };
      const payload = {
        associatedFiles: [],
        data: applicationData,
        programYearId: recentActiveProgramYear.id,
      } as SaveApplicationAPIInDTO;
      const endpoint = `/students/application/${draftApplication.id}/submit`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.Application,
        data: { data: applicationData },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert
      // Verify that the E2 restriction was added to the student
      const studentRestriction = await db.studentRestriction.findOne({
        select: {
          id: true,
          restriction: { restrictionCode: true },
        },
        relations: { restriction: true },
        where: {
          student: { id: student.id },
          restriction: { restrictionCode: RestrictionCode.E2 },
        },
      });
      expect(studentRestriction).toBeDefined();
      expect(studentRestriction.restriction.restrictionCode).toBe(
        RestrictionCode.E2,
      );
    },
  );

  it(
    "Should edit a submitted application and do not add a new E2 restriction" +
      " when the student already has an active RB restriction.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);

      // Add an RB restriction to the student before submitting the application
      const rbRestriction = await db.restriction.findOne({
        where: { restrictionCode: RestrictionCode.RB },
      });
      await db.studentRestriction.save({
        student,
        restriction: rbRestriction,
        isActive: true,
      });

      // Create a submitted application to be edited.
      const application = await saveFakeApplication(
        db.dataSource,
        { student, programYear: recentActiveProgramYear },
        {
          applicationData: {} as ApplicationData,
          offeringIntensity: OfferingIntensity.partTime,
        },
      );
      const offering = application.currentAssessment.offering;
      const applicationData = {
        selectedOfferingDate: offering.studyStartDate,
        selectedOfferingEndDate: offering.studyEndDate,
        selectedProgram: offering.educationProgram.id,
        selectedOffering: offering.id,
        selectedLocation: offering.institutionLocation.id,
        restrictions: [RestrictionCode.E2],
      };
      const payload = {
        associatedFiles: [],
        data: applicationData,
        programYearId: recentActiveProgramYear.id,
      } as SaveApplicationAPIInDTO;
      const endpoint = `/students/application/${application.id}/submit`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.Application,
        data: { data: applicationData },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert
      // Verify that no new E2 restriction was added. The student should still only have the RB restriction.
      const studentRestrictions = await db.studentRestriction.find({
        select: {
          id: true,
          restriction: { restrictionCode: true },
        },
        where: {
          student: { id: student.id },
        },
        relations: { restriction: true },
      });

      expect(studentRestrictions.length).toBe(1);
      expect(
        studentRestrictions.some(
          (sr) => sr.restriction.restrictionCode === RestrictionCode.RB,
        ),
      ).toBe(true);
    },
  );

  it(
    "Should edit a submitted application and do not add a new E2 restriction" +
      " when the student already has an active E2 restriction.",
    async () => {
      // Arrange
      const student = await saveFakeStudent(db.dataSource);

      // Add an E2 restriction to the student before submitting the application.
      const e2Restriction = await db.restriction.findOne({
        where: { restrictionCode: RestrictionCode.E2 },
      });
      await db.studentRestriction.save({
        student,
        restriction: e2Restriction,
        isActive: true,
      });

      // Create a submitted application to be edited.
      const application = await saveFakeApplication(
        db.dataSource,
        { student, programYear: recentActiveProgramYear },
        {
          applicationData: {} as ApplicationData,
          offeringIntensity: OfferingIntensity.partTime,
        },
      );
      const offering = application.currentAssessment.offering;
      const applicationData = {
        selectedOfferingDate: offering.studyStartDate,
        selectedOfferingEndDate: offering.studyEndDate,
        selectedProgram: offering.educationProgram.id,
        selectedOffering: offering.id,
        selectedLocation: offering.institutionLocation.id,
        restrictions: [RestrictionCode.E2],
      };
      const payload = {
        associatedFiles: [],
        data: applicationData,
        programYearId: recentActiveProgramYear.id,
      } as SaveApplicationAPIInDTO;
      const endpoint = `/students/application/${application.id}/submit`;
      const token = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.Application,
        data: { data: applicationData },
      });
      formService.dryRunSubmission = dryRunSubmissionMock;
      // Mock the user received in the token.
      await mockJWTUserInfo(appModule, student.user);

      // Act
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});

      // Assert
      // Verify that no new E2 restriction was added. The student should still only have the E2 restriction.
      const studentRestrictions = await db.studentRestriction.find({
        select: {
          id: true,
          restriction: { restrictionCode: true },
        },
        where: {
          student: { id: student.id },
        },
        relations: { restriction: true },
      });

      expect(studentRestrictions.length).toBe(1);
      expect(
        studentRestrictions.some(
          (sr) => sr.restriction.restrictionCode === RestrictionCode.E2,
        ),
      ).toBe(true);
    },
  );

  it("Should submit a full-time application when the student is configured as a beta user.", async () => {
    // Arrange
    allowBetaUsersOnly(true);
    const { student, draftApplication, payload } =
      await saveApplicationDraftReadyForSubmission();
    // Register the student as a beta user for full-time.
    await db.betaUsersAuthorizations.save({
      givenNames: student.user.firstName,
      lastName: student.user.lastName,
      enabledFrom: new Date(),
    });
    const endpoint = `/students/application/${draftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK);
  });

  it("Should throw a forbidden error when a full-time application is submitted and the user is not a beta user.", async () => {
    // Arrange
    allowBetaUsersOnly(true);
    const { student, draftApplication, payload } =
      await saveApplicationDraftReadyForSubmission();
    const endpoint = `/students/application/${draftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.FORBIDDEN)
      .expect({
        message: "User is not allowed to submit a full-time application.",
        error: "Forbidden",
        statusCode: HttpStatus.FORBIDDEN,
      });
  });

  it("Should throw an unprocessable entity error when a full-time application is submitted and the program year allows only part-time.", async () => {
    // Arrange
    // Create a part-time only program year for the test.
    const programYearPartTimeOnly =
      await ensureProgramYearExistsForPartTimeOnly(db);
    const { student, draftApplication, payload } =
      await saveApplicationDraftReadyForSubmission({
        programYear: programYearPartTimeOnly,
      });
    const endpoint = `/students/application/${draftApplication.id}/submit`;
    const token = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FormNames.Application,
      data: { data: payload.data },
    });
    formService.dryRunSubmission = dryRunSubmissionMock;
    // Mock the user received in the token.
    await mockJWTUserInfo(appModule, student.user);

    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "Offering intensity not allowed for the program year.",
        error: "Unprocessable Entity",
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      });
  });

  /**
   * Save a draft application ready for submission.
   * @param options optional parameters for saving the application.
   * - `programYear` the program year to associate with the application.
   * If not provided, the recent active program year will be used.
   * @returns the student, draft application, and payload.
   */
  async function saveApplicationDraftReadyForSubmission(options?: {
    programYear?: ProgramYear;
  }): Promise<{
    student: Student;
    draftApplication: Application;
    payload: SaveApplicationAPIInDTO;
  }> {
    // Create a student and a draft application.
    const student = await saveFakeStudent(db.dataSource);
    const draftApplication = await saveFakeApplication(
      db.dataSource,
      { student, programYear: options?.programYear ?? recentActiveProgramYear },
      {
        applicationData: {} as ApplicationData,
        applicationStatus: ApplicationStatus.Draft,
        offeringIntensity: OfferingIntensity.fullTime,
      },
    );
    // Create an offering.
    const selectedOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering({
        auditUser: student.user,
        institutionLocation: draftApplication.location,
      }),
    );
    const selectedProgram = selectedOffering.educationProgram;
    const applicationData = {
      selectedOfferingDate: selectedOffering.studyStartDate,
      selectedOfferingEndDate: selectedOffering.studyEndDate,
      selectedProgram: selectedProgram.id,
      selectedOffering: selectedOffering.id,
      selectedLocation: selectedOffering.institutionLocation.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: recentActiveProgramYear.id,
    } as SaveApplicationAPIInDTO;
    return {
      student,
      draftApplication,
      payload,
    };
  }

  /**
   * Mock the allowBetaUsersOnly config value to allow changing the behavior
   * of the beta users authorization between tests.
   * @param allow true to allow beta users only, false to allow all users.
   */
  function allowBetaUsersOnly(allow: boolean): void {
    jest
      .spyOn(configService, "allowBetaUsersOnly", "get")
      .mockReturnValue(allow);
  }

  afterAll(async () => {
    await app?.close();
  });
});
