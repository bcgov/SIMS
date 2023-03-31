import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeDisbursementOveraward,
  createFakeStudentAssessment,
  createFakeApplication,
} from "@sims/test-utils";
import { Repository } from "typeorm";
import {
  Application,
  DisbursementOveraward,
  DisbursementOverawardOriginType,
  Student,
  StudentAssessment,
} from "@sims/sims-db";
import {
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getStudentToken,
  FakeStudentUsersTypes,
  getStudentByFakeStudentUserType,
} from "../../../../testHelpers";
import { StudentsOverawardAPIOutDTO } from "../../models/overaward.dto";

describe("OverawardStudentsController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;
  let student: Student;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
    student = await getStudentByFakeStudentUserType(
      FakeStudentUsersTypes.FakeStudentUserType1,
      dataSource,
    );
  });

  it("Should return student overawards when available.", async () => {
    // Arrange
    // Prepare the student assessment to create overaward.
    const application = await applicationRepo.save(
      createFakeApplication({
        student,
      }),
    );
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({ auditUser: student.user, application }),
    );
    application.currentAssessment = studentAssessment;
    await applicationRepo.save(application);
    // Create an overaward.
    const reassessmentOveraward = createFakeDisbursementOveraward({ student });
    reassessmentOveraward.studentAssessment = studentAssessment;
    reassessmentOveraward.disbursementValueCode = "CSLP";
    reassessmentOveraward.overawardValue = 500;
    reassessmentOveraward.originType =
      DisbursementOverawardOriginType.ReassessmentOveraward;
    reassessmentOveraward.addedDate = new Date();
    await disbursementOverawardRepo.save(reassessmentOveraward);
    const endpoint = "/students/overaward";
    const studentToken = await getStudentToken(
      FakeStudentUsersTypes.FakeStudentUserType1,
    );

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(studentToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body.length).toBeGreaterThan(0);
        const overawards = response.body as StudentsOverawardAPIOutDTO[];
        // TODO change the expect.arrayContaining, when we create the mock student token.
        expect(overawards).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              applicationNumber:
                reassessmentOveraward.studentAssessment.application
                  .applicationNumber,
              awardValueCode: reassessmentOveraward.disbursementValueCode,
              overawardValue: reassessmentOveraward.overawardValue,
            }),
          ]),
        );
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
