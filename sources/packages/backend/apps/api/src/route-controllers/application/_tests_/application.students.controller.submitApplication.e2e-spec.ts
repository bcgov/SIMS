import { HttpStatus, INestApplication } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { DataSource } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
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
} from "@sims/test-utils";
import {
  ApplicationData,
  ApplicationStatus,
  EducationProgramOffering,
  OfferingIntensity,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { SaveApplicationAPIInDTO } from "../models/application.dto";
import { FormNames, FormService } from "../../../services";
import { AppStudentsModule } from "../../../app.students.module";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";
import { createFakeSFASApplication } from "@sims/test-utils/factories/sfas-application";

describe("ApplicationStudentsController(e2e)-submitApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let db: E2EDataSources;
  let formService: FormService;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    // Program Year for the following tests.
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    // To check the study dates overlap error, the BYPASS_APPLICATION_SUBMIT_VALIDATIONS needs to be set false.
    process.env.BYPASS_APPLICATION_SUBMIT_VALIDATIONS = "false";
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
    await mockUserLoginInfo(appModule, student);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study period or a pending PIR.",
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
    await mockUserLoginInfo(appModule, student);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study period or a pending PIR.",
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
    await mockUserLoginInfo(appModule, student);
    // Act/Assert
    await request(app.getHttpServer())
      .patch(endpoint)
      .send(payload)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message:
          "There is an existing application already with overlapping study period or a pending PIR.",
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
    await mockUserLoginInfo(appModule, student);
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
      await mockUserLoginInfo(appModule, student);
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
      await mockUserLoginInfo(appModule, student);
      // Act/Assert
      await request(app.getHttpServer())
        .patch(endpoint)
        .send(payload)
        .auth(token, BEARER_AUTH_TYPE)
        .expect(HttpStatus.OK)
        .expect({});
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
