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
  saveFakeStudentFileUpload,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  FileOriginType,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentFile,
} from "@sims/sims-db";
import { StudentAppealAPIInDTO } from "../../models/student-appeal.dto";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormService } from "../../../../services";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_HAS_PENDING_APPEAL,
  INVALID_APPLICATION_NUMBER,
} from "../../../../constants";

describe("StudentAppealStudentsController(e2e)-submitStudentAppeal", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let applicationRepo: Repository<Application>;
  let studentAppealRequestRepo: Repository<StudentAppealRequest>;
  let studentFileRepo: Repository<StudentFile>;
  const FINANCIAL_INFORMATION_FORM_NAME = "studentfinancialinformationappeal";
  const DEPENDANT_INFORMATION_FORM_NAME = "studentDependantsAppeal";
  const PARTNER_INFORMATION_FORM_NAME = "partnerinformationandincomeappeal";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
    db = createE2EDataSources(dataSource);
    applicationRepo = dataSource.getRepository(Application);
    studentAppealRequestRepo = dataSource.getRepository(StudentAppealRequest);
    studentFileRepo = dataSource.getRepository(StudentFile);
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
            files: [],
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
            files: [],
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
          message:
            "Only one change request can be submitted at a time for each application. When your current request is approved or denied by StudentAid BC, you will be able to submit a new one.",
          errorType: APPLICATION_HAS_PENDING_APPEAL,
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
          files: [],
        },
      ],
    };
    // Mock user service to return the saved student.
    mockUserLoginInfo(appModule, student);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

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
          files: [],
        },
      ],
    };
    // Mock user service to return the saved student.
    mockUserLoginInfo(appModule, student);
    // Get any student user token.
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

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
    const payload: StudentAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
          files: [],
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

  it("Should save student dependent details when the student submits an appeal for student dependants.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      student: student,
    });
    // Set application status to completed
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    // Create a pd dependent file and a dependant custody file
    const pdDependentFile = await saveFakeStudentFileUpload(
      appDataSource,
      {
        student,
        creator: student.user,
      },
      { fileOrigin: FileOriginType.Temporary },
    );
    const dependantCustodyFile = await saveFakeStudentFileUpload(
      appDataSource,
      {
        student,
        creator: student.user,
      },
      { fileOrigin: FileOriginType.Temporary },
    );
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
              originalName: pdDependentFile.fileName,
              name: pdDependentFile.uniqueFileName,
              url: "student/files/" + pdDependentFile.uniqueFileName,
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
          originalName: dependantCustodyFile.fileName,
          name: dependantCustodyFile.uniqueFileName,
          url: "student/files/" + dependantCustodyFile.uniqueFileName,
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
          files: [
            pdDependentFile.uniqueFileName,
            dependantCustodyFile.uniqueFileName,
          ],
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
      formName: DEPENDANT_INFORMATION_FORM_NAME,
      data: { data: dependantInformationData },
    });

    formService.dryRunSubmission = dryRunSubmissionMock;

    const endpoint = `/students/appeal/application/${application.id}`;

    // Act/Assert
    let createdAppealId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdAppealId = +response.body.id;
      });

    // Expect created student appeal request data to be the same in the payload
    const newStudentAppealRequest = await studentAppealRequestRepo.findOne({
      where: { studentAppeal: { id: createdAppealId } },
    });
    expect(newStudentAppealRequest.submittedData).toStrictEqual(
      payload.studentAppealRequests[0].formData,
    );
    // Expect the file origin type to be Appeal for the updated pd dependent file
    const updatedPdDependentFile = await studentFileRepo.findOne({
      where: { id: pdDependentFile.id },
    });
    expect(updatedPdDependentFile.fileOrigin).toBe(FileOriginType.Appeal);
    // Expect the file origin type to be Appeal for the updated dependent custody file
    const updatedDependantCustodyFile = await studentFileRepo.findOne({
      where: { id: dependantCustodyFile.id },
    });
    expect(updatedDependantCustodyFile.fileOrigin).toBe(FileOriginType.Appeal);

    // Expect to call the dry run submission.
    expect(dryRunSubmissionMock).toHaveBeenCalledWith(
      DEPENDANT_INFORMATION_FORM_NAME,
      {
        ...dependantInformationData,
        programYear: application.programYear.programYear,
      },
    );
  });

  it("Should save the current year partner income when the student submits an appeal for the current year partner income.", async () => {
    // Arrange
    const student = await saveFakeStudent(appDataSource);
    const application = await saveFakeApplication(appDataSource, {
      student: student,
    });
    // Set application status to completed.
    application.applicationStatus = ApplicationStatus.Completed;
    await applicationRepo.save(application);
    // Create a current year partner income file.
    const partnerIncomeFile = await saveFakeStudentFileUpload(
      appDataSource,
      {
        student,
        creator: student.user,
      },
      { fileOrigin: FileOriginType.Temporary },
    );
    // Prepare the data to request a change of current year partner income.
    const partnerIncomeInformationData = {
      programYear: application.programYear.programYear,
      relationshipStatus: "married",
      partnerEstimatedIncome: 1000,
      currentYearPartnerIncome: 2000,
      reasonsignificantdecreaseInPartnerIncome: "other",
      decreaseInPartnerIncomeSupportingDocuments: [
        {
          storage: "url",
          originalName: partnerIncomeFile.fileName,
          name: partnerIncomeFile.uniqueFileName,
          url: "student/files/" + partnerIncomeFile.uniqueFileName,
          size: 0,
          type: "text/plain",
          hash: "1cb251ec0d568de6a929b520c4aed8d1",
        },
      ],
      otherExceptionalPartnerCircumstance: "any",
    };

    const payload: StudentAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: PARTNER_INFORMATION_FORM_NAME,
          formData: partnerIncomeInformationData,
          files: [partnerIncomeFile.uniqueFileName],
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
    const formService = await getProviderInstanceForModule(
      appModule,
      AppStudentsModule,
      FormService,
    );
    const dryRunSubmissionMock = jest.fn().mockResolvedValue({
      valid: true,
      formName: PARTNER_INFORMATION_FORM_NAME,
      data: { data: partnerIncomeInformationData },
    });

    formService.dryRunSubmission = dryRunSubmissionMock;

    const endpoint = `/students/appeal/application/${application.id}`;

    // Act/Assert
    let createdAppealId: number;
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .send(payload)
      .expect(HttpStatus.CREATED)
      .expect((response) => {
        expect(response.body.id).toBeGreaterThan(0);
        createdAppealId = +response.body.id;
      });

    // Expect created student appeal request data to be the same in the payload.
    const newStudentAppealRequest = await studentAppealRequestRepo.findOne({
      where: { studentAppeal: { id: createdAppealId } },
    });
    expect(newStudentAppealRequest.submittedData).toStrictEqual(
      payload.studentAppealRequests[0].formData,
    );
    // Expect the file origin type to be Appeal for the updated current year partner income file.
    const updatedPartnerIncomeFile = await studentFileRepo.findOne({
      where: { id: partnerIncomeFile.id },
    });
    expect(updatedPartnerIncomeFile.fileOrigin).toBe(FileOriginType.Appeal);

    // Expect to call the dry run submission.
    expect(dryRunSubmissionMock).toHaveBeenCalledWith(
      PARTNER_INFORMATION_FORM_NAME,
      {
        ...partnerIncomeInformationData,
        programYear: application.programYear.programYear,
      },
    );
  });

  afterAll(async () => {
    await app?.close();
  });
});
