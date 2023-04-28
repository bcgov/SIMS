import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeStudent,
  createFakeDisbursementOveraward,
  createFakeUser,
  createFakeStudentAssessment,
  saveFakeApplication,
} from "@sims/test-utils";
import { Repository, DataSource } from "typeorm";
import {
  Application,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
  StudentAssessment,
  User,
} from "@sims/sims-db";

import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";

describe("OverawardInstitutionController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return student overawards when student has some overawards", async () => {
    // Arrange.
    const user = await userRepo.save(createFakeUser());
    const student = await studentRepo.save(createFakeStudent());
    // Prepare the student assessment to create overaward.
    const application = await saveFakeApplication(appDataSource, {
      student,
    });
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({ auditUser: user, application }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.creator = user;
    reassessmentOveraward.disbursementValueCode = "CSLP";
    reassessmentOveraward.overawardValue = 100;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedBy = user;
    reassessmentOveraward.addedDate = new Date();
    await disbursementOverawardRepo.save(reassessmentOveraward);
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}`;

    // Act/Assert.
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .expect([
        {
          dateAdded: reassessmentOveraward.addedDate.toISOString(),
          createdAt: reassessmentOveraward.createdAt.toISOString(),
          overawardOrigin: reassessmentOveraward.originType,
          awardValueCode: reassessmentOveraward.disbursementValueCode,
          overawardValue: reassessmentOveraward.overawardValue,
          applicationNumber: application.applicationNumber,
          assessmentTriggerType: studentAssessment.triggerType,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
