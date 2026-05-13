import {
  Body,
  Controller,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from "@nestjs/common";
import {
  ApplicationSubmissionService,
  ApplicationSubmissionSetupResponse,
  WorkersSetupResponse,
} from "../../services";
import {
  SetupApplicationSubmissionAPIInDTO,
  SetupSubmittedApplicationAPIInDTO,
} from "./models/application-submission.dto";

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
   * @param batchSize number of draft applications to create in this batch.
   * @param payload setup payload containing the student user name.
   * @returns setup response with per-iteration application data and the base application payload.
   */
  @Post("setup/:batchSize")
  @HttpCode(200)
  async setup(
    @Param("batchSize", ParseIntPipe) batchSize: number,
    @Body() payload: SetupApplicationSubmissionAPIInDTO,
  ): Promise<ApplicationSubmissionSetupResponse> {
    return this.applicationSubmissionService.createDraftApplications(
      batchSize,
      payload.studentUserName,
    );
  }

  /**
   * Creates submitted applications spread across multiple fake students for the workers stress test.
   * Applications and assessments are written directly in the Submitted state so the queue-consumers
   * scheduler picks them up without any Keycloak token per student, enabling high-volume workflow
   * instance creation across independent Camunda process branches.
   * @param batchSize number of submitted applications to create in this batch.
   * @param payload payload containing the number of students to distribute applications across.
   * @returns summary with the total number of submitted applications created.
   */
  @Post("setup/submitted/:batchSize")
  @HttpCode(200)
  async workersSetup(
    @Param("batchSize", ParseIntPipe) batchSize: number,
    @Body() payload: SetupSubmittedApplicationAPIInDTO,
  ): Promise<WorkersSetupResponse> {
    return this.applicationSubmissionService.createSubmittedApplications(
      batchSize,
      payload.numberOfStudents,
    );
  }
}
