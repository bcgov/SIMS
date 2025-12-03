import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  FakeStudentUsersTypes,
  getRecentActiveProgramYear,
  getStudentToken,
  mockJWTUserInfo,
  resetMockJWTUserInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  createFakeStudentAppeal,
  createFakeStudentAppealRequest,
  createFakeSupportingUser,
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
  OfferingIntensity,
  ProgramYear,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentFile,
  SupportingUserType,
} from "@sims/sims-db";
import { StudentApplicationAppealAPIInDTO } from "../../models/student-appeal.dto";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormNames, FormService } from "../../../../services";
import {
  APPLICATION_CHANGE_NOT_ELIGIBLE,
  APPLICATION_HAS_PENDING_APPEAL,
  APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
} from "../../../../constants";

describe("StudentAppealStudentsController(e2e)-submitApplicationAppeal", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let applicationRepo: Repository<Application>;
  let studentAppealRequestRepo: Repository<StudentAppealRequest>;
  let studentFileRepo: Repository<StudentFile>;
  const FINANCIAL_INFORMATION_FORM_NAME = "studentfinancialinformationappeal";
  const DEPENDANT_INFORMATION_FORM_NAME = "studentdependantsappeal";
  const PARTNER_INFORMATION_FORM_NAME = "partnerinformationandincomeappeal";
  const ROOM_AND_BOARD_COSTS_FORM_NAME = "roomandboardcostsappeal";
  let recentActiveProgramYear: ProgramYear;

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
    recentActiveProgramYear = await getRecentActiveProgramYear(db);
  });

  beforeEach(async () => {
    await resetMockJWTUserInfo(appModule);
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
      const payload: StudentApplicationAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
            files: [],
          },
        ],
      };

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
      await mockJWTUserInfo(appModule, student.user);

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
      const payload: StudentApplicationAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
            files: [],
          },
        ],
      };

      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      const endpoint = `/students/appeal/application/${application.id}`;
      await mockJWTUserInfo(appModule, student.user);
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
    const payload: StudentApplicationAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
          files: [],
        },
      ],
    };
    // Mock JWT user to return the saved student from token.
    mockJWTUserInfo(appModule, student.user);
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
          "Given application either does not exist or is not complete to submit change request or appeal.",
        error: "Not Found",
        statusCode: HttpStatus.NOT_FOUND,
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
    const payload: StudentApplicationAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
          files: [],
        },
      ],
    };
    // Mock JWT user to return the saved student from token.
    await mockJWTUserInfo(appModule, student.user);
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
        message:
          "This application is no longer eligible to submit change request.",
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
    const payload: StudentApplicationAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: DEPENDANT_INFORMATION_FORM_NAME,
          formData: dependantInformationData,
          files: [],
        },
      ],
    };
    // Mock JWT user to return the saved student from token.
    await mockJWTUserInfo(appModule, student.user);
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
        message: "Not able to submit change request due to invalid request.",
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
    const payload: StudentApplicationAppealAPIInDTO = {
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
    // Mock JWT user to return the saved student from token.
    await mockJWTUserInfo(appModule, student.user);
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
    const application = await saveFakeApplication(appDataSource, undefined, {
      applicationStatus: ApplicationStatus.Completed,
    });
    // Create a current year partner income file.
    const partnerIncomeFile = await saveFakeStudentFileUpload(
      appDataSource,
      {
        student: application.student,
        creator: application.student.user,
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

    const payload: StudentApplicationAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: PARTNER_INFORMATION_FORM_NAME,
          formData: partnerIncomeInformationData,
          files: [partnerIncomeFile.uniqueFileName],
        },
      ],
    };
    // Mock JWT user to return the saved student from token.
    await mockJWTUserInfo(appModule, application.student.user);
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

  it(
    "Should create room and board costs appeal " +
      "when student submit an appeal for a program year which is eligible for appeal process.",
    async () => {
      // Arrange
      // Create student to submit application.
      const student = await saveFakeStudent(appDataSource);
      // Create application submit appeal with eligible program year.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          programYear: recentActiveProgramYear,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Create a temporary file for room and board costs appeal.
      const roomAndBoardFile = await saveFakeStudentFileUpload(
        appDataSource,
        {
          student,
          creator: student.user,
        },
        { fileOrigin: FileOriginType.Temporary },
      );
      // Prepare the data to request a change of financial information.
      const roomAndBoardAppealData = {
        roomAndBoardAmount: 561,
        roomAndBoardSituations: {
          parentUnEmployed: false,
          parentEarnLowIncome: false,
          parentReceiveIncomeAssistance: false,
          livingAtHomePayingRoomAndBoard: true,
          parentReceiveCanadaPensionOrOldAgeSupplement: false,
        },
        roomAndBoardSupportingDocuments: [
          {
            url: `student/files/${roomAndBoardFile.uniqueFileName}`,
            hash: "",
            name: roomAndBoardFile.uniqueFileName,
            size: 4,
            type: "text/plain",
            storage: "url",
            originalName: roomAndBoardFile.fileName,
          },
        ],
      };
      const payload: StudentApplicationAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: ROOM_AND_BOARD_COSTS_FORM_NAME,
            formData: roomAndBoardAppealData,
            files: [roomAndBoardFile.uniqueFileName],
          },
        ],
      };
      // Mock JWT user to return the saved student from token.
      await mockJWTUserInfo(appModule, student.user);
      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the form service to validate the dry-run submission result.
      // and this mock must be removed.
      const formService = await getProviderInstanceForModule(
        appModule,
        AppStudentsModule,
        FormService,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: ROOM_AND_BOARD_COSTS_FORM_NAME,
        data: { data: roomAndBoardAppealData },
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
        ROOM_AND_BOARD_COSTS_FORM_NAME,
      );
      expect(appealRequest.submittedData).toStrictEqual(roomAndBoardAppealData);
      // Expect to call the dry run submission.
      expect(dryRunSubmissionMock).toHaveBeenCalledWith(
        ROOM_AND_BOARD_COSTS_FORM_NAME,
        roomAndBoardAppealData,
      );
    },
  );

  it(
    "Should create step parent waiver appeal for an application" +
      " when student submit the appeal for a full-time application reported with both the parents.",
    async () => {
      // Arrange
      // Create student to submit application.
      const student = await saveFakeStudent(appDataSource);
      // Create application to submit appeal with eligible program year.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          programYear: recentActiveProgramYear,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Create supporting user parents for the application.
      const parent1 = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: "Parent One",
          },
        },
      );
      const parent2 = createFakeSupportingUser(
        { application },
        {
          initialValues: {
            supportingUserType: SupportingUserType.Parent,
            fullName: "Parent Two",
          },
        },
      );
      await db.supportingUser.save([parent1, parent2]);

      // Part of the payload data that will be re-populated by the server.
      // This re-populated data is provided to form.io to execute dry run submission.
      const payloadDataToBeRePopulatedByServer = {
        parents: [
          { id: parent1.id, fullName: parent1.fullName },
          // Expect the API to re-populate the parent details with correct id and name.
          { id: 1, fullName: "Some manipulated name" },
        ],
      };
      // Create a temporary file for step parent waiver appeal.
      const stepParentWaiverSupportingFile = await saveFakeStudentFileUpload(
        appDataSource,
        {
          student,
          creator: student.user,
        },
        { fileOrigin: FileOriginType.Temporary },
      );
      // Prepare the data to submit step parent waiver appeal.
      const stepParentWaiverAppealData = {
        ...payloadDataToBeRePopulatedByServer,
        selectedParent: parent1.id,
        stepParentWaiverSupportingDocuments: [
          {
            url: `student/files/${stepParentWaiverSupportingFile.uniqueFileName}`,
            hash: "",
            name: stepParentWaiverSupportingFile.uniqueFileName,
            size: 4,
            type: "text/plain",
            storage: "url",
            originalName: stepParentWaiverSupportingFile.fileName,
          },
        ],
      };
      const payload: StudentApplicationAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FormNames.StepParentWaiverAppeal,
            formData: stepParentWaiverAppealData,
            files: [stepParentWaiverSupportingFile.uniqueFileName],
          },
        ],
      };
      // Expected submitted data after the server re-populates the correct parent details.
      const expectedSubmittedData = {
        ...stepParentWaiverAppealData,
        parents: [
          { id: parent1.id, fullName: parent1.fullName },
          { id: parent2.id, fullName: parent2.fullName },
        ],
      };
      // Mock JWT user to return the saved student from token.
      await mockJWTUserInfo(appModule, student.user);
      // Get any student user token.
      const studentToken = await getStudentToken(
        FakeStudentUsersTypes.FakeStudentUserType1,
      );
      // Mock the form service to validate the dry-run submission result.
      // and this mock must be removed.
      const formService = await getProviderInstanceForModule(
        appModule,
        AppStudentsModule,
        FormService,
      );
      const dryRunSubmissionMock = jest.fn().mockResolvedValue({
        valid: true,
        formName: FormNames.StepParentWaiverAppeal,
        data: { data: expectedSubmittedData },
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
        FormNames.StepParentWaiverAppeal,
      );
      expect(appealRequest.submittedData).toStrictEqual(expectedSubmittedData);
      // Expect to call the dry run submission.
      expect(dryRunSubmissionMock).toHaveBeenCalledWith(
        FormNames.StepParentWaiverAppeal,
        expectedSubmittedData,
      );
    },
  );

  it(
    "Should throw unprocessable entity exception when student submit an appeal with a change request form" +
      " which is not eligible for the appeal submission.",
    async () => {
      // Arrange
      // Create student to submit application.
      const student = await saveFakeStudent(appDataSource);
      // Create application submit appeal with eligible program year.
      const application = await saveFakeApplicationDisbursements(
        db.dataSource,
        {
          student,
          programYear: recentActiveProgramYear,
        },
        {
          offeringIntensity: OfferingIntensity.fullTime,
          applicationStatus: ApplicationStatus.Completed,
        },
      );
      // Prepare the data to request a change of financial information which is not an eligible appeal.
      const financialInformationData = {
        programYear: application.programYear.programYear,
        taxReturnIncome: 8000,
        haveDaycareCosts12YearsOrOver: "no",
        haveDaycareCosts11YearsOrUnder: "no",
      };
      const payload: StudentApplicationAppealAPIInDTO = {
        studentAppealRequests: [
          {
            formName: FINANCIAL_INFORMATION_FORM_NAME,
            formData: financialInformationData,
            files: [],
          },
        ],
      };
      // Mock JWT user to return the saved student from token.
      await mockJWTUserInfo(appModule, student.user);
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
          message:
            "One or more forms submitted are not valid for appeal submission.",
          error: "Unprocessable Entity",
        });
    },
  );

  it("Should throw unprocessable entity exception when student submit an appeal for an ineligible application.", async () => {
    // Arrange
    const application = await saveFakeApplication(
      db.dataSource,
      { programYear: recentActiveProgramYear },
      {
        offeringIntensity: OfferingIntensity.partTime,
        applicationStatus: ApplicationStatus.Completed,
      },
    );
    const payload: StudentApplicationAppealAPIInDTO = {
      studentAppealRequests: [
        {
          formName: ROOM_AND_BOARD_COSTS_FORM_NAME,
          formData: {},
          files: [],
        },
      ],
    };
    // Mock JWT user to return the saved student from token.
    await mockJWTUserInfo(appModule, application.student.user);
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
        message: "The application is not eligible to submit an appeal.",
        errorType: APPLICATION_IS_NOT_ELIGIBLE_FOR_AN_APPEAL,
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
