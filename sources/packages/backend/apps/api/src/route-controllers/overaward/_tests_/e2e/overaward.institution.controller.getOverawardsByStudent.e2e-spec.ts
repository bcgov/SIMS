import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import {
  createFakeStudent,
  createFakeDisbursementOveraward,
  createFakeUser,
  createFakeStudentAssessment,
  createFakeApplication,
} from "@sims/test-utils";
import { Repository } from "typeorm";
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
  BEARER_AUTH_TYPE,
  createTestingAppModule,
  getInstitutionToken,
  InstitutionTokenTypes,
} from "../../../../testHelpers";
import { OverawardDetailsAPIOutDTO } from "../../models/overaward.dto";
import { getUserFullName } from "../../../../utilities";

describe("OverawardInstitutionController(e2e)-getOverawardsByStudent", () => {
  let app: INestApplication;
  let userRepo: Repository<User>;
  let studentRepo: Repository<Student>;
  let assessmentRepo: Repository<StudentAssessment>;
  let applicationRepo: Repository<Application>;
  let disbursementOverawardRepo: Repository<DisbursementOveraward>;

  beforeAll(async () => {
    const { nestApplication, dataSource } = await createTestingAppModule();
    app = nestApplication;
    userRepo = dataSource.getRepository(User);
    studentRepo = dataSource.getRepository(Student);
    assessmentRepo = dataSource.getRepository(StudentAssessment);
    applicationRepo = dataSource.getRepository(Application);
    disbursementOverawardRepo = dataSource.getRepository(DisbursementOveraward);
  });

  it("Should return student overawards", async () => {
    // Arrange
    const user = await userRepo.save(createFakeUser());
    const student = await studentRepo.save(createFakeStudent());
    // Prepare the student assessment to create overaward.
    const application = await applicationRepo.save(
      createFakeApplication({
        student,
      }),
    );
    const studentAssessment = await assessmentRepo.save(
      createFakeStudentAssessment({ auditUser: user, application }),
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
    const institutionUserToken = await getInstitutionToken(
      InstitutionTokenTypes.CollegeFUser,
    );
    const endpoint = `/institutions/overaward/student/${student.id}`;

    // Act/Assert
    await request(app.getHttpServer())
      .get(endpoint)
      .auth(institutionUserToken, BEARER_AUTH_TYPE)
      .expect(HttpStatus.OK)
      .then((response) => {
        expect(response.body).toHaveLength(1);
        const [overaward] = response.body as OverawardDetailsAPIOutDTO[];
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

  afterAll(async () => {
    await app?.close();
  });
});
