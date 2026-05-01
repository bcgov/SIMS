import { Body, Controller, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApplicationSubmissionService } from "../../services";
import { SetupApplicationSubmissionAPIInDTO } from "./models/application-submission.dto";
import { ApplicationSetupData } from "../../services/application-submission/application-submission.service";

@Controller("application-submission")
export class ApplicationSubmissionController {
  constructor(
    private readonly applicationSubmissionService: ApplicationSubmissionService,
  ) {}

  /**
   * Creates draft applications required for the application submission load test.
   * The e2e test student identified by the provided credentials is used as the
   * application owner. Each application receives a unique offering with
   * non-overlapping study dates to allow real API submission without triggering
   * the study date overlap validation.
   * @param iterations number of draft applications to create.
   * @param payload setup payload containing the student user name.
   * @returns per-iteration setup data containing application, offering and program IDs.
   */
  @Post("setup/:iterations")
  async setup(
    @Param("iterations", ParseIntPipe) iterations: number,
    @Body() payload: SetupApplicationSubmissionAPIInDTO,
  ): Promise<ApplicationSetupData[]> {
    return this.applicationSubmissionService.createDraftApplications(
      iterations,
      payload.studentUserName,
    );
  }
}
