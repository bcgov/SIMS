import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeStudentAssessment,
  saveFakeApplication,
} from "@sims/test-utils";
import { Repository, DataSource } from "typeorm";
import {
  Application,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  StudentAssessment,
} from "@sims/sims-db";

import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";

describe("OverawardInstitutionsController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let appDataSource: DataSource;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    appDataSource = dataSource;
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return student overawards when student has some overawards.", async () => {
    // Arrange
    // Prepare the student assessment to create overaward.
    const application = await saveFakeApplication(appDataSource);
    const student = application.student;
    const user = application.student.user;
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = application.currentAssessment;
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
          assessmentTriggerType: application.currentAssessment.triggerType,
        },
      ]);
  });

  afterAll(async () => {
    await app?.close();
  });
});
