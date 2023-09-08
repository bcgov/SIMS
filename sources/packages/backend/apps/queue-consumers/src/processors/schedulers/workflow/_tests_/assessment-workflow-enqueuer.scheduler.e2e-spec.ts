import { Job } from "bull";
import { createMock } from "@golevelup/ts-jest";
import { INestApplication } from "@nestjs/common";
import { QueueNames } from "@sims/utilities";
import {
  createTestingAppModule,
  describeProcessorRootTest,
} from "../../../../../test/helpers";
import { AssessmentWorkflowEnqueuerScheduler } from "../assessment-workflow-enqueuer.scheduler";
import {
  E2EDataSources,
  createE2EDataSources,
  saveFakeApplication,
} from "@sims/test-utils";
import { Not } from "typeorm";
import { StudentAssessmentStatus } from "@sims/sims-db";

describe(
  describeProcessorRootTest(QueueNames.AssessmentWorkflowEnqueuer),
  () => {
    let app: INestApplication;
    let db: E2EDataSources;
    let processor: AssessmentWorkflowEnqueuerScheduler;

    beforeAll(async () => {
      const { nestApplication, dataSource } = await createTestingAppModule();
      app = nestApplication;
      db = createE2EDataSources(dataSource);
      // Processor under test.
      processor = app.get(AssessmentWorkflowEnqueuerScheduler);
    });

    beforeEach(async () => {
      // Ensure that all assessments will be cancelled.
      await db.studentAssessment.update(
        {
          studentAssessmentStatus: Not(StudentAssessmentStatus.Cancelled),
        },
        { studentAssessmentStatus: StudentAssessmentStatus.Cancelled },
      );
    });

    it("Should cancel the assessment pending disbursements and rollback overawards when the cancelled application has overawards and also one sent and one pending disbursements.", async () => {
      // Arrange

      // Application submitted with original assessment.
      const application = await saveFakeApplication(db.dataSource);

      // Queued job.
      const job = createMock<Job<void>>();

      // Act
      const result = await processor.enqueueAssessmentOperations(job);

      // Assert
      console.log(application);
      console.log(result);
    });
  },
);
