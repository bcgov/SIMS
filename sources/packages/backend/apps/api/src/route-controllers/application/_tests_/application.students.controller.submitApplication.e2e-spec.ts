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
  saveFakeStudent,
  saveFakeApplication,
  ensureProgramYearExists,
  createFakeApplication,
  getProviderInstanceForModule,
  saveFakeSFASIndividual,
  createFakeEducationProgramOffering,
  createFakeUser,
} from "@sims/test-utils";
import {
  Application,
  ApplicationStatus,
  EducationProgramOffering,
  OfferingIntensity,
  ProgramYear,
  Student,
} from "@sims/sims-db";
import { addDays, getISODateOnlyString } from "@sims/utilities";
import { SaveApplicationAPIInDTO } from "../models/application.dto";
import { SystemUsersService } from "@sims/services";
import { FormNames, FormService } from "../../../services";
import { AppStudentsModule } from "../../../app.students.module";
import { createFakeSFASPartTimeApplication } from "@sims/test-utils/factories/sfas-part-time-application";

describe("ApplicationStudentsController(e2e)-submitApplication", () => {
  let app: INestApplication;
  let appModule: TestingModule;
  let appDataSource: DataSource;
  let sharedStudent: Student;
  let db: E2EDataSources;
  let programYear: ProgramYear;
  let systemUsersService: SystemUsersService;
  let formService: FormService;
  const PROGRAM_YEAR_PREFIX = 1990;

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appModule = module;
    appDataSource = dataSource;
    db = createE2EDataSources(dataSource);
    sharedStudent = await saveFakeStudent(db.dataSource);
    systemUsersService = nestApplication.get(SystemUsersService);
    // Program Year for the following tests.
    programYear = await ensureProgramYearExists(db, PROGRAM_YEAR_PREFIX);
    formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    // To check the study dates overlap error, the BYPASS_APPLICATION_SUBMIT_VALIDATIONS needs to be set false.
    process.env.BYPASS_APPLICATION_SUBMIT_VALIDATIONS = "false";
  });

  beforeEach(async () => {
    await mockUserLoginInfo(appModule, sharedStudent);
  });

  it("Should throw study dates overlap error when an application submitted for a student via the SIMS system has overlapping study start or study end dates with another application.", async () => {
    // Arrange
    const firstApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(10090)),
      studyEndDate: getISODateOnlyString(addDays(10110)),
      offeringIntensity: OfferingIntensity.partTime,
    } as EducationProgramOffering;
    await saveFakeApplication(
      appDataSource,
      {
        student: sharedStudent,
        programYear,
      },
      { offeringInitialValues: firstApplicationOfferingInitialValues },
    );
    const secondApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(10100)),
      studyEndDate: getISODateOnlyString(addDays(10120)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const secondApplication = createFakeApplication(
      {
        student: sharedStudent,
        programYear,
      },
      {
        initialValue: {
          data: {},
          applicationStatus: ApplicationStatus.Draft,
          applicationStatusUpdatedOn: new Date(),
          creator: systemUsersService.systemUser,
          createdAt: new Date(),
        } as Application,
      },
    );
    const secondDraftApplication = await db.application.save(secondApplication);
    const auditUser = await db.user.save(createFakeUser());
    const secondApplicationOffering = await db.educationProgramOffering.save(
      createFakeEducationProgramOffering(
        {
          auditUser,
        },
        {
          initialValues: {
            studyStartDate:
              secondApplicationOfferingInitialValues.studyStartDate,
            studyEndDate: secondApplicationOfferingInitialValues.studyEndDate,
          },
        },
      ),
    );
    const secondApplicationProgram = secondApplicationOffering.educationProgram;
    const applicationData = {
      programYear,
      selectedOfferingDate:
        secondApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        secondApplicationOfferingInitialValues.studyEndDate,
      programYearStartDate: programYear.startDate,
      programYearEndDate: programYear.endDate,
      howWillYouBeAttendingTheProgram:
        secondApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: secondApplicationProgram.id,
      selectedOffering: secondApplicationOffering.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: programYear.id,
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

  it("Should throw study dates overlap error when an application submitted for a student via the SFAS system has overlapping study start or study end dates with another application.", async () => {
    // Arrange
    const sfasIndividual = await saveFakeSFASIndividual(db.dataSource, {
      initialValues: {
        lastName: sharedStudent.user.lastName,
        birthDate: sharedStudent.birthDate,
        sin: sharedStudent.sinValidation.sin,
      },
    });
    const firstFakeSFASPartTimeApplication = createFakeSFASPartTimeApplication(
      { individual: sfasIndividual },
      {
        initialValues: {
          startDate: getISODateOnlyString(addDays(9990)),
          endDate: getISODateOnlyString(addDays(10010)),
        },
      },
    );
    await db.sfasPartTimeApplications.save(firstFakeSFASPartTimeApplication);
    // Create a fake offering for the second application.
    const auditUser = await db.user.save(createFakeUser());
    const secondApplicationOfferingInitialValues = {
      studyStartDate: getISODateOnlyString(addDays(10000)),
      studyEndDate: getISODateOnlyString(addDays(10020)),
      offeringIntensity: OfferingIntensity.partTime,
    };
    const fakeOffering = createFakeEducationProgramOffering(
      {
        auditUser,
      },
      {
        initialValues: {
          studyStartDate: secondApplicationOfferingInitialValues.studyStartDate,
          studyEndDate: secondApplicationOfferingInitialValues.studyEndDate,
        },
      },
    );
    const savedOffering = await db.educationProgramOffering.save(fakeOffering);
    const secondApplication = createFakeApplication(
      {
        student: sharedStudent,
        programYear,
      },
      {
        initialValue: {
          data: {},
          applicationStatus: ApplicationStatus.Draft,
          applicationStatusUpdatedOn: new Date(),
          creator: systemUsersService.systemUser,
          createdAt: new Date(),
        } as Application,
      },
    );
    const secondDraftApplication = await db.application.save(secondApplication);
    const applicationData = {
      programYear,
      selectedOfferingDate:
        secondApplicationOfferingInitialValues.studyStartDate,
      selectedOfferingEndDate:
        secondApplicationOfferingInitialValues.studyEndDate,
      programYearStartDate: programYear.startDate,
      programYearEndDate: programYear.endDate,
      howWillYouBeAttendingTheProgram:
        secondApplicationOfferingInitialValues.offeringIntensity,
      selectedProgram: savedOffering.educationProgram.id,
      selectedOffering: savedOffering.id,
    };
    const payload = {
      associatedFiles: [],
      data: applicationData,
      programYearId: programYear.id,
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

  afterAll(async () => {
    await app?.close();
  });
});
