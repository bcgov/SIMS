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

    // TODO: Scenarios to be created.
    it("Should queue an assessment when an active application has at least one pending assessment.", async () => {
      // Arrange

      // Application submitted with original assessment.
      await saveFakeApplication(db.dataSource);

      // Queued job.
      const job = createMock<Job<void>>();

      // Act
      await processor.enqueueAssessmentOperations(job);

      // Assert
      // TODO: Asserts to be created.
    });
  },
);
