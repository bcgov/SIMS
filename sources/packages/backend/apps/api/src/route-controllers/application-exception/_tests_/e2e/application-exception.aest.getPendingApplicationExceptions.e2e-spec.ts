import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { Repository } from "typeorm";
import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getAESTToken,
} from "../../../../testHelpers";
import {
  createFakeApplication,
  createFakeApplicationException,
  createFakeStudent,
} from "@sims/test-utils";
import {
  Application,
  ApplicationException,
  ApplicationExceptionStatus,
  Student,
  User,
} from "@sims/sims-db";
import { ClientTypeBaseRoute } from "../../../../types";
import { SystemUsersService } from "@sims/services";
import { getUserFullName } from "../../../../utilities";

describe(`${ClientTypeBaseRoute.AEST}-ApplicationExceptionAESTController(e2e)-getExceptionById`, () => {
  let app: INestApplication;
  let applicationExceptionRepo: Repository<ApplicationException>;
  let systemUsersService: SystemUsersService;
  let userRepo: Repository<User>;
  let applicationRepo: Repository<Application>;
  let studentRepo: Repository<Student>;
  let creator: User;
  let assessedBy: User;

  beforeAll(async () => {
    const { nestApplication, dataSource, module } =
      await createTestingAppModule();
    app = nestApplication;
    applicationExceptionRepo = dataSource.getRepository(ApplicationException);
    systemUsersService = await module.get(SystemUsersService);
    userRepo = dataSource.getRepository(User);
    applicationRepo = dataSource.getRepository(Application);
    studentRepo = dataSource.getRepository(Student);
  });

  it("Should get pending application exceptions when available.", async () => {
    // Arrange
    creator = await systemUsersService.systemUser();
    assessedBy = await userRepo.findOneBy({
      userName: process.env.E2E_TEST_AEST_BUSINESS_ADMINISTRATORS_USER,
    });
    const application1Promise =
      await createFakeApplicationWithApplicationException(
        ApplicationExceptionStatus.Pending,
      );
    const application2Promise =
      await createFakeApplicationWithApplicationException(
        ApplicationExceptionStatus.Pending,
      );
    const application3Promise =
      await createFakeApplicationWithApplicationException(
        ApplicationExceptionStatus.Approved,
      );
    const application4Promise =
      await createFakeApplicationWithApplicationException(
        ApplicationExceptionStatus.Declined,
      );
    const [application1, application2, application3, application4] =
      await Promise.all([
        application1Promise,
        application2Promise,
        application3Promise,
        application4Promise,
      ]);

    // Act/Assert
    await request(app.getHttpServer())
      .get(
        `/aest/application-exception?page=0&pageLimit=100&sortField=submittedDate&sortOrder=ASC`,
      )
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .then((response) => {
        const applicationExceptionList = response.body.results;
        expect(applicationExceptionList).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              applicationId: application1.id,
              studentId: application1.student.id,
              applicationNumber: application1.applicationNumber,
              submittedDate:
                application1.applicationException.createdAt.toISOString(),
              fullName: getUserFullName(application1.student.user),
            }),
            expect.objectContaining({
              applicationId: application2.id,
              studentId: application2.student.id,
              applicationNumber: application2.applicationNumber,
              submittedDate:
                application2.applicationException.createdAt.toISOString(),
              fullName: getUserFullName(application2.student.user),
            }),
          ]),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application3.id,
            studentId: application3.student.id,
            applicationNumber: application3.applicationNumber,
            submittedDate:
              application3.applicationException.createdAt.toISOString(),
            fullName: getUserFullName(application3.student.user),
          }),
        );
        expect(applicationExceptionList).not.toContainEqual(
          expect.objectContaining({
            applicationId: application4.id,
            studentId: application4.student.id,
            applicationNumber: application4.applicationNumber,
            submittedDate:
              application4.applicationException.createdAt.toISOString(),
            fullName: getUserFullName(application4.student.user),
          }),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });

  /**
   * Create a fake application with an application exception associated.
   * @param applicationExceptionStatus application exception status.
   * @returns application with an application exception associated.
   */
  async function createFakeApplicationWithApplicationException(
    applicationExceptionStatus: ApplicationExceptionStatus,
  ): Promise<Application> {
    // Create fake application exception.
    let applicationException = await createFakeApplicationException(
      applicationExceptionStatus,
      { creator, assessedBy },
    );
    applicationException = await applicationExceptionRepo.save(
      applicationException,
    );

    // Create fake student.
    let student = createFakeStudent();
    student = await studentRepo.save(student);

    // Create fake application.
    const application = createFakeApplication();
    application.student = student;
    application.applicationException = applicationException;
    return applicationRepo.save(application);
  }
});
