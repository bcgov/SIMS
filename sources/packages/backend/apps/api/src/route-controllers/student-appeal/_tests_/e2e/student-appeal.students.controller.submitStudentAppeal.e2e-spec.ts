import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  getProviderInstanceForModule,
  saveFakeApplication,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  StudentAppealRequest,
  StudentAppealStatus,
} from "@sims/sims-db";
import { StudentAppealAPIInDTO } from "../../models/student-appeal.dto";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormService } from "../../../../services";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  INVALID_APPLICATION_NUMBER,
} from "../../../../constants";

describe("StudentAppealStudentsController(e2e)-submitStudentAppeal", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let studentToken: string;
  let applicationRepo: Repository<Application>;
  let studentAppealRequestRepo: Repository<StudentAppealRequest>;
  const STUDENT_NEW_INCOME_FORM_NAME = "studentIncomeAppeal";
  const PARTNER_NEW_INCOME_FORM_NAME = "partnerIncomeAppeal";
  const DISABILITY_INFORMATION_FORM_NAME = "studentDisabilityAppeal";
  const FINANCIAL_INFORMATION_FORM_NAME = "studentfinancialinformationappeal";
  const DEPENDANT_INFORMATION_FORM_NAME = "studentDependantsAppealPartTime";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
    db = createE2EDataSources(dataSource);
    applicationRepo = dataSource.getRepository(Application);
    studentAppealRequestRepo = dataSource.getRepository(StudentAppealRequest);
    studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
  });

  it(
    "Should create a student appeal for financial information change when student submit " +
      "an appeal and does not have any other pending appeal.",
    async () => {
      // Arrange
      // Create student to submit application.
      const student = await saveFakeStudent(appDataSource);
      // Create application to request change.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
        },
        { applicationStatus: ApplicationStatus.Completed },
      );
      // Prepare the data to request a change of financial information.
      const financialInformationData = {
        programYear: application.programYear.programYear,
        taxReturnIncome: 8000,
        haveDaycareCosts12YearsOrOver: "no",
        haveDaycareCosts11YearsOrUnder: "no",
      };
      const payload: StudentAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
          },
        ],
      };
      // Mock user service to return the saved student.
      await mockUserLoginInfo(appModule, student);
      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the form service to validate the dry-run submission result.
      // TODO: Form service must be hosted for E2E tests to validate dry run submission
      // and this mock must be removed.
      const formService = await getProviderInstanceForModule(
        appModule,
        AppStudentsModule,
        FormService,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FINANCIAL_INFORMATION_FORM_NAME,
        data: { data: financialInformationData },
      });

      formService.dryRunSubmission = dryRunSubmissionMock;

      const endpoint = `/students/appeal/application/${application.id}`;

      // Act/Assert
      let createdAppealId: number;
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.CREATED)
        .then((response) => {
          expect(response.body.id).toBeGreaterThan(0);
          createdAppealId = +response.body.id;
        });
      const studentAppeal = await db.studentAppeal.findOne({
        select: {
          id: true,
          appealRequests: {
            id: true,
            submittedFormName: true,
            submittedData: true,
          },
        },
        relations: { appealRequests: true },
        where: { application: { id: application.id } },
      });
      const [appealRequest] = studentAppeal.appealRequests;
      expect(studentAppeal.id).toBe(createdAppealId);
      expect(appealRequest.submittedFormName).toBe(
        FINANCIAL_INFORMATION_FORM_NAME,
      );
      expect(appealRequest.submittedData).toStrictEqual(
        financialInformationData,
      );
      // Expect to call the dry run submission.
      expect(dryRunSubmissionMock).toHaveBeenCalledWith(
        FINANCIAL_INFORMATION_FORM_NAME,
        {
          ...financialInformationData,
          programYear: application.programYear.programYear,
        },
      );
    },
  );

  it(
    "Should throw Unprocessable Entity Exception when a student submit an appeal for financial information " +
      "but already have a pending appeal to be completed.",
    async () => {
      // Arrange
      // Create student to submit application.
      const student = await saveFakeStudent(appDataSource);
      // Create application to request change.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
        },
        { applicationStatus: ApplicationStatus.Completed },
      );
      // Create pending appeal for the student.
      const pendingAppealRequest = createFakeStudentAppealRequest();
      pendingAppealRequest.appealStatus = StudentAppealStatus.Pending;
      const pendingAppeal = createFakeStudentAppeal({
        application,
        appealRequests: [pendingAppealRequest],
      });
      await db.studentAppeal.save(pendingAppeal);
      // Prepare the data to request a change of financial information.
      const financialInformationData = {
        programYear: application.programYear.programYear,
        taxReturnIncome: 8000,
        haveDaycareCosts12YearsOrOver: "no",
        haveDaycareCosts11YearsOrUnder: "no",
      };
      const payload: StudentAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
          },
        ],
      };
      // Mock user service to return the saved student.
      await mockUserLoginInfo(appModule, student);
      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const endpoint = `/students/appeal/application/${application.id}`;

      // Act/Assert
      await request(app.getHttpServer())
        .post(endpoint)
        .send(payload)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .expect(HttpStatus.UNPROCESSABLE_ENTITY)
        .expect({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: "There is already a pending appeal for this student.",
          error: "Unprocessable Entity",
        });
    },
  );

  it("Should throw not found error when the application does not exist.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    // Prepare the data to request a change of dependants.
    const dependantInformationData = {
      hasDependents: "no",
      programYear: "2023-2024",
    };
    const payload: StudentAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
        },
      ],
    };
    // Mock user service to return the saved student.
    mockUserLoginInfo(appModule, student);

    const endpoint = `/students/appeal/application/000`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.NOT_FOUND)
      .expect({
        message:
          "Given application either does not exist or is not complete to request change.",
        errorType: INVALID_APPLICATION_NUMBER,
      });
  });

  it("Should throw unprocessable entity exception error when the application is archived.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      student: student,
    });
    // Set application status to completed and archived field to true
    application.isArchived = true;
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    // Prepare the data to request a change of dependants.
    const dependantInformationData = {
      hasDependent: "yes",
    };
    const payload: StudentAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
        },
      ],
    };
    // Mock user service to return the saved student.
    mockUserLoginInfo(appModule, student);

    const endpoint = `/students/appeal/application/${application.id}`;

    // Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.UNPROCESSABLE_ENTITY)
      .expect({
        message: "This application is no longer eligible to request changes.",
        errorType: APPLICATION_CHANGE_NOT_ELIGIBLE,
      });
  });

  it("Should throw unprocessable entity exception error when the payload is invalid for formIO dryRun test.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      student: student,
    });
    // Set application status to completed
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    // Prepare the data to request a change of dependants.
    const dependantInformationData = {
      hasDependent: "yes",
    };
    const payload = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
        },
      ],
    };
    // Mock user service to return the saved student.
    mockUserLoginInfo(appModule, student);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    formService.dryRunSubmission = jest.fn().mockResolvedValue({
      valid: false,
      data: { data: payload.studentAppealRequests },
    });

    const endpoint = `/students/appeal/application/${application.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.BAD_REQUEST)
      .expect({
        statusCode: HttpStatus.BAD_REQUEST,
        message: "Not able to submit student appeal due to invalid request.",
        error: "Bad Request",
      });
  });

  it("Should determine student dependants when the student submits an appeal for student dependants.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      student: student,
    });
    // Set application status to completed
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    // Prepare the data to request a change of dependants.
    const dependantInformationData = {
      hasDependents: "yes",
      programYear: application.programYear.programYear,
      dependants: [
        {
          fullName: "Mike HOZZENFEUGEN",
          dateOfBirth: "2024-01-01",
          attendingPostSecondarySchool: "no",
          declaredOnTaxes: "no",
        },
        {
          fullName: "Jane HOZZENFEUGEN",
          dateOfBirth: "2006-01-01",
          attendingPostSecondarySchool: "yes",
          declaredOnTaxes: "yes",
          pdDependentUpload: [
            {
              storage: "url",
              originalName: "JessLee_AlexLeeTax_2023.txt",
              name: "JessLee_AlexLeeTax_2023-4315285a-b756-4084-95dc-781b51692d27.txt",
              url: "student/files/JessLee_AlexLeeTax_2023-4315285a-b756-4084-95dc-781b51692d27.txt",
              size: 0,
              type: "text/plain",
              hash: "1cb251ec0d568de6a929b520c4aed8d1",
            },
          ],
        },
      ],
      supportnocustodyDependants: "yes",
      dependantCustodyFileUpload: [
        {
          storage: "url",
          originalName: "JessLee_DependantsCustody.txt",
          name: "JessLee_DependantsCustody-b76efea7-1515-4bd4-9a90-e55d7dde05a0.txt",
          url: "student/files/JessLee_DependantsCustody-b76efea7-1515-4bd4-9a90-e55d7dde05a0.txt",
          size: 0,
          type: "text/plain",
          hash: "1cb251ec0d568de6a929b520c4aed8d1",
        },
      ],
    };
    const payload: StudentAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
        },
      ],
    };
    // Mock user service to return the saved student.
    await mockUserLoginInfo(appModule, student);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );
    // Mock the form service to validate the dry-run submission result.
    // TODO: Form service must be hosted for E2E tests to validate dry run submission
    // and this mock must be removed.
    const formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: FINANCIAL_INFORMATION_FORM_NAME,
      data: { data: dependantInformationData },
    });

    formService.dryRunSubmission = dryRunSubmissionMock;

    const endpoint = `/students/appeal/application/${application.id}`;

    // Act/Assert
    const response = await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED);

    const newStudentAppealRequest = await studentAppealRequestRepo.findOne({
      where: { studentAppeal: { id: response.body.id } },
    });
    expect(newStudentAppealRequest.submittedData).toStrictEqual(
      payload.studentAppealRequests[0].formData,
    );

    // Expect to call the dry run submission.
    expect(dryRunSubmissionMock).toHaveBeenCalledWith(
      DEPENDANT_INFORMATION_FORM_NAME,
      {
        ...dependantInformationData,
        programYear: application.programYear.programYear,
      },
    );
  });

  it(
    "Should determine the total number of student appeal requests for a student appeal when the student " +
      "submits an appeal for all of the student income, partner's income, disability information and dependants",
    async () => {
      // Arrange
      const student = await saveFakeStudent(appDataSource);
      const application = await saveFakeApplication(appDataSource, {
        student: student,
      });
      // Set application status to completed
      application.applicationStatus = ApplicationStatus.Completed;
      await applicationRepo.save(application);
      // Prepare the data to request a change of dependants.
      const studentIncomeData = {
        applicationId: "",
        applicationStatus: "",
        studentNewIncome: 6000,
      };
      const partnerIncomeData = {
        applicationId: "",
        applicationStatus: "",
        partnerNewIncome: 6000,
      };
      const disabilityInformationData = { studentNewPDPPDStatus: "yes" };
      const financialInformationData = {
        programYear: application.programYear.programYear,
        taxReturnIncome: 8000,
        haveDaycareCosts12YearsOrOver: "no",
        haveDaycareCosts11YearsOrUnder: "no",
      };
      const dependantInformationData = {
        hasDependents: "yes",
        programYear: application.programYear.programYear,
        dependants: [
          {
            fullName: "Mike HOZZENFEUGEN",
            dateOfBirth: "2024-01-01",
            attendingPostSecondarySchool: "no",
            declaredOnTaxes: "no",
          },
          {
            fullName: "Jane HOZZENFEUGEN",
            dateOfBirth: "2006-01-01",
            attendingPostSecondarySchool: "yes",
            declaredOnTaxes: "yes",
            pdDependentUpload: [
              {
                storage: "url",
                originalName: "JessLee_AlexLeeTax_2023.txt",
                name: "JessLee_AlexLeeTax_2023-4315285a-b756-4084-95dc-781b51692d27.txt",
                url: "student/files/JessLee_AlexLeeTax_2023-4315285a-b756-4084-95dc-781b51692d27.txt",
                size: 0,
                type: "text/plain",
                hash: "1cb251ec0d568de6a929b520c4aed8d1",
              },
            ],
          },
        ],
        supportnocustodyDependants: "yes",
        dependantCustodyFileUpload: [
          {
            storage: "url",
            originalName: "JessLee_DependantsCustody.txt",
            name: "JessLee_DependantsCustody-b76efea7-1515-4bd4-9a90-e55d7dde05a0.txt",
            url: "student/files/JessLee_DependantsCustody-b76efea7-1515-4bd4-9a90-e55d7dde05a0.txt",
            size: 0,
            type: "text/plain",
            hash: "1cb251ec0d568de6a929b520c4aed8d1",
          },
        ],
      };
      const payload: StudentAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: STUDENT_NEW_INCOME_FORM_NAME,
            formData: studentIncomeData,
          },
          {
            formName: PARTNER_NEW_INCOME_FORM_NAME,
            formData: partnerIncomeData,
          },
          {
            formName: DISABILITY_INFORMATION_FORM_NAME,
            formData: disabilityInformationData,
          },
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
          },
          {
            formName: DEPENDANT_INFORMATION_FORM_NAME,
            formData: dependantInformationData,
          },
        ],
      };
      // Mock user service to return the saved student.
      await mockUserLoginInfo(appModule, student);
      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the form service to validate the dry-run submission result.
      // TODO: Form service must be hosted for E2E tests to validate dry run submission
      // and this mock must be removed.
      for (const appealRequest of payload.studentAppealRequests) {
        const formService = await getProviderInstanceForModule(
          appModule,
          AppStudentsModule,
          FormService,
        );
        const dryRunSubmissionMock = jest.fn().mockResolvedValue({
          valid: true,
          formName: appealRequest.formName,
          data: { data: appealRequest.formData },
        });
        formService.dryRunSubmission = dryRunSubmissionMock;
      }

      const endpoint = `/students/appeal/application/${application.id}`;

      // Act/ Assert
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .auth(studentToken, BEARER_AUTH_TYPE)
        .send(payload)
        .expect(HttpStatus.CREATED);

      const newStudentAppealRequests = await studentAppealRequestRepo.find({
        where: { studentAppeal: { id: response.body.id } },
      });
      expect(newStudentAppealRequests.length).toBe(
        payload.studentAppealRequests.length,
      );
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
