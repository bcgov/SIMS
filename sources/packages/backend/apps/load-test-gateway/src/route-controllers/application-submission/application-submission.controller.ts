import { Body, Controller, HttpCode, Param, ParseIntPipe, Post } from "@nestjs/common";
import { ApplicationSubmissionService } from "../../services";
import {
  SetupApplicationSubmissionAPIInDTO,
  WorkersSetupAPIInDTO,
} from "./models/application-submission.dto";
import {
  ApplicationSubmissionSetupResponse,
  WorkersSetupResponse,
} from "../../services/application-submission/application-submission.service";

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
   * @returns setup response with per-iteration application data and the base application payload.
   */
  @Post("setup/:iterations")
  @HttpCode(200)
  async setup(
    @Param("iterations", ParseIntPipe) iterations: number,
    @Body() payload: SetupApplicationSubmissionAPIInDTO,
  ): Promise<ApplicationSubmissionSetupResponse> {
    return this.applicationSubmissionService.createDraftApplications(
      iterations,
      payload.studentUserName,
    );
  }

  /**
   * Creates submitted applications spread across multiple fake students for the workers stress test.
   * Applications and assessments are written directly in the Submitted state so the queue-consumers
   * scheduler picks them up without any Keycloak token per student, enabling high-volume workflow
   * instance creation across independent Camunda process branches.
   * @param iterations number of submitted applications to create.
   * @param payload payload containing the number of students to distribute applications across.
   * @returns summary with the total number of submitted applications created.
   */
  @Post("workers-setup/:iterations")
  @HttpCode(200)
  async workersSetup(
    @Param("iterations", ParseIntPipe) iterations: number,
    @Body() payload: WorkersSetupAPIInDTO,
  ): Promise<WorkersSetupResponse> {
    return this.applicationSubmissionService.createSubmittedApplications(
      iterations,
      payload.numberOfStudents,
    );
  }
}
