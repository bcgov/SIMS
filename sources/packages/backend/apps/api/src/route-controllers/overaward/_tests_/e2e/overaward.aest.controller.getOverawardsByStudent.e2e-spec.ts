import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeStudent,
  createFakeDisbursementOveraward,
  createFakeUser,
  createFakeStudentAssessment,
  saveFakeApplication,
} from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import {
  Application,
  AssessmentTriggerType,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";

import {
  AESTGroups,
  BEARER_AUTH_TYPE,
  getAESTToken,
  createTestingAppModule,
} from "../../../../testHelpers";
import { AESTOverawardAPIOutDTO } from "../../models/overaward.dto";
import { getUserFullName } from "../../../../utilities";

describe("OverawardAESTController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let appDataSource: DataSource;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    appDataSource = dataSource;
  });

  it("Should return student overaward when AEST user belongs to any of the allowed groups", async () => {
    // Arrange
    const student = await studentRepo.save(createFakeStudent());
    const endpoint = `/aest/overaward/student/${student.id}`;
    const expectedPermissions = [
      {
        aestGroup: AESTGroups.BusinessAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.Operations,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.OperationsAdministrators,
        expectedHttpStatus: HttpStatus.OK,
      },
      {
        aestGroup: AESTGroups.MOFOperations,
        expectedHttpStatus: HttpStatus.OK,
      },
    ];

    // Act/Assert
    for (const permission of expectedPermissions) {
      await request(app.getHttpServer())
        .get(endpoint)
        .auth(await getAESTToken(permission.aestGroup), BEARER_AUTH_TYPE)
        .expect(permission.expectedHttpStatus);
    }
  });

  it("Should return student overawards", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const student = await studentRepo.save(createFakeStudent());
    // Prepare the student assessment to create overaward.
    const application = await saveFakeApplication(appDataSource, { student });
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({
        auditUser: user,
        application,
        editStatusUpdatedBy: user,
      }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.creator = user;
    reassessmentOveraward.disbursementValueCode = "CSLF";
    reassessmentOveraward.overawardValue = 500;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedBy = user;
    reassessmentOveraward.addedDate = new Date();
    await disbursementOverawardRepo.save(reassessmentOveraward);
    const endpoint = `/aest/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toHaveLength(1);
        const [overaward] = response.body as AESTOverawardAPIOutDTO[];
        expect(overaward.dateAdded).toBe(
          reassessmentOveraward.addedDate.toISOString(),
        );
        expect(overaward.overawardOrigin).toBe(
          DisbursementOverawardOriginType.ReassessmentOveraward,
        );
        expect(overaward.addedByUser).toBe(
          getUserFullName(reassessmentOveraward.addedBy),
        );
        expect(overaward.applicationNumber).toBe(application.applicationNumber);
        expect(overaward.assessmentTriggerType).toBe(
          AssessmentTriggerType.OriginalAssessment,
        );
        expect(overaward.awardValueCode).toBe("CSLF");
        expect(overaward.overawardValue).toBe(500);
      });
  });

  it("Should throw not found error when invalid student id is provided", async () => {
    // Arrange
    const endpoint = `/aest/overaward/student/999999`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(
        await getAESTToken(AESTGroups.BusinessAdministrators),
        BEARER_AUTH_TYPE,
      )
      .expect(HttpStatus.NOT_FOUND);
  });

  afterAll(async () => {
    await app?.close();
  });
});
