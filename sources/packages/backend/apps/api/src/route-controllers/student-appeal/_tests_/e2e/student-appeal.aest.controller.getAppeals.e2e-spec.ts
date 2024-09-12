import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { DataSource, Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
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
import {
  Application,
  ApplicationStatus,
  StudentAppealRequest,
  StudentAppealStatus,
  StudentFile,
} from "@sims/sims-db";
import { getUserFullName } from "../../../../utilities";

describe("StudentAppealAESTController(e2e)-getAppeals", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let appModule: TestingModule;
  let db: E2EDataSources;
  let applicationRepo: Repository<Application>;
  let studentAppealRequestRepo: Repository<StudentAppealRequest>;
  let studentFileRepo: Repository<StudentFile>;

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
  it("Should return only one row in the ministry appeals dashboard when a one student creates an appeal.", async () => {
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
    // Create approved student appeal.
    const appealRequest = createFakeStudentAppealRequest(
      {},
      { initialValues: { appealStatus: StudentAppealStatus.Pending } },
    );
    const appeal = createFakeStudentAppeal({
      application,
      appealRequests: [appealRequest],
    });
    await db.studentAppeal.save(appeal);

    const endpoint = `/aest/appeal/pending?page=0&pageLimit=10&sortField=submittedDate&sortOrder=ASC&searchCriteria=${application.applicationNumber}`;
    const token = await getAESTToken(AESTGroups.BusinessAdministrators);

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(token, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toEqual({
          count: 1,
          results: [
            {
              appealId: appeal.id,
              applicationId: application.id,
              applicationNumber: application.applicationNumber,
              fullName: getUserFullName(student.user),
              studentId: student.id,
              submittedDate: appeal.submittedDate.toISOString(),
            },
          ],
        });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
