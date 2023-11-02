import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Application,
  EducationProgramOffering,
  StudentAssessmentStatus,
  StudyBreaksAndWeeks,
} from "@sims/sims-db";
import { saveFakeApplication } from "@sims/test-utils";
import { DataSource, Repository } from "typeorm";
import { APPLICATION_DATA_SINGLE_INDEPENDENT } from "../../utils/application.constants";

@Injectable()
export class WorkflowDataPreparationService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Application)
    private readonly applicationRepo: Repository<Application>,
    @InjectRepository(EducationProgramOffering)
    private readonly offeringRepo: Repository<EducationProgramOffering>,
  ) {}

  async createApplicationAndAssessment() {
    const submittedApplication = await saveFakeApplication(this.dataSource);
    const offering = submittedApplication.currentAssessment.offering;
    offering.studyBreaks = {
      totalFundedWeeks: 16,
    } as StudyBreaksAndWeeks;
    console.log(offering);
    await this.offeringRepo.save(offering);
    submittedApplication.data = {
      ...APPLICATION_DATA_SINGLE_INDEPENDENT,
      selectedOffering: submittedApplication.currentAssessment.offering.id,
    };
    submittedApplication.currentAssessment.studentAssessmentStatus =
      StudentAssessmentStatus.Queued;
    return await this.applicationRepo.save(submittedApplication);
  }
}
