import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource } from "typeorm";
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
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import { ApplicationStatus, StudentAppealStatus } from "@sims/sims-db";
import { StudentAppealAPIInDTO } from "../../models/student-appeal.dto";
import { AppStudentsModule } from "../../../../app.students.module";
import { FormService } from "../../../../services";

describe("StudentAppealStudentsController(e2e)-submitStudentAppeal", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  const FINANCIAL_INFORMATION_FORM_NAME = "studentfinancialinformationappeal";

  beforeAll(async () => {
    const { nestApplication, module, dataSource } =
      await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    appModule = module;
    db = createE2EDataSources(dataSource);
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

  afterAll(async () => {
    await app?.close();
  });
});
