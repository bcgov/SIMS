import { Controller, Post } from "@nestjs/common";

@Controller("workflow")
export class WorkflowController {
  @Post("prepare-assessment-data")
  async prepareAssessmentData(): Promise<number[]> {
    return [100];
  }
}
