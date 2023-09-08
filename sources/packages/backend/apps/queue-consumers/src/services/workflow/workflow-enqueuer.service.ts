import { Injectable } from "@nestjs/common";
import { ApplicationService } from "..";
import { Queue } from "bull";
import { StartAssessmentQueueInDTO } from "@sims/services/queue";
import { InjectQueue } from "@nestjs/bull";
import { QueueNames, processInParallel } from "@sims/utilities";
import { Application, StudentAssessmentStatus } from "@sims/sims-db";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";

@Injectable()
export class WorkflowEnqueuerService {
  constructor(
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    private readonly applicationService: ApplicationService,
    @InjectQueue(QueueNames.StartApplicationAssessment)
    private readonly startAssessmentQueue: Queue<StartAssessmentQueueInDTO>,
  ) {}

  async enqueueStartAssessmentWorkflows(): Promise<void> {
    const applications =
      await this.applicationService.getApplicationsToStartAssessments();
    await processInParallel(
      (application: Application) => this.queueNextAssessment(application),
      applications,
    );
  }

  private async queueNextAssessment(application: Application): Promise<void> {
    const [nextAssessment] = application.studentAssessments;
    nextAssessment.studentAssessmentStatus = StudentAssessmentStatus.Queued;
    application.currentProcessingAssessment = nextAssessment;
    await this.applicationRepo.save(application);
    await this.startAssessmentQueue.add({ assessmentId: nextAssessment.id });
  }
}
