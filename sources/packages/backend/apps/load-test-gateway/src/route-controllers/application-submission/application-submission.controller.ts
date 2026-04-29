import { Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApplicationSubmissionService } from "../../services";

@Controller("application-submission")
export class ApplicationSubmissionController {
  constructor(
    private readonly applicationSubmissionService: ApplicationSubmissionService,
  ) {}

  /**
   * Create draft applications required for the application submission load test.
   * @param iterations load test iterations.
   * @returns application IDs.
   */
  @Post("setup/:iterations")
  async setup(
    @Param("iterations", ParseIntPipe) iterations: number,
  ): Promise<number[]> {
    return this.applicationSubmissionService.createDraftApplications(
      iterations,
    );
  }

  /**
   * Submit an application by performing a formio dry-run validation and updating
   * the application status to submitted in the database.
   * @param applicationId application ID.
   */
  @Post("submit/:applicationId")
  async submit(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<void> {
    await this.applicationSubmissionService.submitApplication(applicationId);
  }
}
