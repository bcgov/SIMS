import { Controller, Param, ParseIntPipe, Patch, Post } from "@nestjs/common";

@Controller("workflow")
export class WorkflowController {
  @Post("prepare-assessment-data/:iterations")
  async prepareAssessmentData(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    const data = [];
    for (let i = 1; i <= iterations; i++) {
      data.push(i);
    }
    return data;
  }

  @Patch("submit-assessment/:assessmentId")
  async submitAssessment(
    @Param("assessmentId", ParseIntPipe) assessmentId: number,
  ): Promise<void> {
    console.log("Assessment started for: ", assessmentId);
    return;
  }
}
