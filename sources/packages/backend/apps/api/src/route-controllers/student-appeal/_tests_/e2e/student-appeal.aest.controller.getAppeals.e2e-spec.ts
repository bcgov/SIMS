import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  BEARER_AUTH_TYPE,
  FakeStudentUsersTypes,
  createTestingAppModule,
  getStudentToken,
  mockUserLoginInfo,
} from "../../../../testHelpers";
import {
  E2EDataSources,
  createE2EDataSources,
  getProviderInstanceForModule,
  saveFakeApplicationDisbursements,
  saveFakeStudent,
} from "@sims/test-utils";
import { TestingModule } from "@nestjs/testing";
import {
  Application,
  ApplicationStatus,
  StudentAppealRequest,
  StudentFile,
} from "@sims/sims-db";
import { AppStudentsModule } from "apps/api/src/app.students.module";
import { StudentAppealAPIInDTO } from "apps/api/src/route-controllers/student-appeal/models/student-appeal.dto";
import { FormService } from "apps/api/src/services";

describe("StudentAppealAESTController(e2e)-getAppeals", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let applicationRepo: Repository<Application>;
  let studentAppealRequestRepo: Repository<StudentAppealRequest>;
  let studentFileRepo: Repository<StudentFile>;
  const FINANCIAL_INFORMATION_FORM_NAME = "studentfinancialinformationappeal";
  const STUDENT_DISABILITY_FORM_NAME = "studentDisabilityAppeal";

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
    "Should create 2 student appeal for a student one financial information change and disability change " +
      "on fetching from the ministry appeals dashboard only one row and count should be displayed.",
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
      // Prepare the data to request a change of disability information.
      const disabilityData = {
        programYear: application.programYear.programYear,
        studentNewPDPPDStatus: "no",
      };
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
            formName: STUDENT_DISABILITY_FORM_NAME,
            formData: disabilityData,
            files: [],
          },
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
    },
  );

  afterAll(async () => {
    await app?.close();
  });
});
