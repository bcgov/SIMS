import { Controller, Patch, Post } from "@nestjs/common";

@Controller("workflow")
export class WorkflowController {
  @Post("prepare-assessment-data")
  async prepareAssessmentData(): Promise<number[]> {
    return [100];
  }

  @Patch("submit-assessment")
  async submitAssessment(): Promise<void> {
    return;
  }
}
