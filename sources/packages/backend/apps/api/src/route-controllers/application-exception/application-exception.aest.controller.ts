import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApplicationExceptionService } from "../../services";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ApplicationExceptionSummaryAPIOutDTO,
  DetailedApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "./models/application-exception.dto";
import { IUserToken } from "../../auth/userToken.interface";
import { CustomNamedError } from "@sims/utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApplicationExceptionStatus } from "@sims/sims-db";
import {
  ApplicationExceptionPaginationOptionsAPIInDTO,
  PaginatedResultsAPIOutDTO,
} from "../models/pagination.dto";
import { Role } from "../../auth/roles.enum";
import { WorkflowClientService } from "@sims/services";
import { ApplicationExceptionControllerService } from "./application-exception.controller.service";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-exception")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-exception`)
export class ApplicationExceptionAESTController extends BaseController {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly workflowClientService: WorkflowClientService,
    private readonly applicationExceptionControllerService: ApplicationExceptionControllerService,
  ) {
    super();
  }

  /**
   * Get a student application exception detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @returns student application exception information.
   */
  @Get(":exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  async getExceptionById(
    @Param("exceptionId", ParseIntPipe) exceptionId: number,
  ): Promise<DetailedApplicationExceptionAPIOutDTO> {
    return this.applicationExceptionControllerService.getExceptionDetails<DetailedApplicationExceptionAPIOutDTO>(
      exceptionId,
      { assessDetails: true },
    );
  }

  /**
   * Update the student exception based on the status of all exception requests
   * associated with the exception.
   * If all exception requests are approved, the exception is approved.
   * If at least one exception request is declined, the exception is declined.
   * @param exceptionId exception to be approved or denied.
   * @param payload exception request details with the note.
   */
  @Roles(Role.StudentApproveDeclineExceptions)
  @Patch(":exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  @ApiUnprocessableEntityResponse({
    description:
      `Student application exception must be in ${ApplicationExceptionStatus.Pending} state to be assessed` +
      " or there is no pending exception request to updated for the application exception" +
      " or the exception requests to be updated does not match all the pending exception requests for the student application exception" +
      " or student application exception not updated.",
  })
  async approveException(
    @Param("exceptionId", ParseIntPipe) exceptionId: number,
    @Body() payload: UpdateApplicationExceptionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      const updatedException =
        await this.applicationExceptionService.approveException(
          exceptionId,
          payload.approvalExceptionRequests,
          payload.noteDescription,
          userToken.userId,
        );
      await this.workflowClientService.sendApplicationExceptionApproval(
        updatedException.applicationId,
        updatedException.exceptionStatus,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case STUDENT_APPLICATION_EXCEPTION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case STUDENT_APPLICATION_EXCEPTION_INVALID_STATE:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Gets all pending student application exceptions.
   * @param pagination options to execute the pagination.
   * @returns list of pending student application exceptions.
   */
  @Get()
  async getPendingApplicationExceptions(
    @Query() pagination: ApplicationExceptionPaginationOptionsAPIInDTO,
  ): Promise<PaginatedResultsAPIOutDTO<ApplicationExceptionSummaryAPIOutDTO>> {
    const applicationExceptions =
      await this.applicationExceptionService.getPendingApplicationExceptions(
        pagination,
      );

    return {
      results: applicationExceptions.results.map((eachApplication) => ({
        applicationId: eachApplication.application.id,
        studentId: eachApplication.application.student.id,
        applicationNumber: eachApplication.application.applicationNumber,
        submittedDate: eachApplication.createdAt,
        givenNames: eachApplication.application.student.user.firstName,
        lastName: eachApplication.application.student.user.lastName,
      })),
      count: applicationExceptions.count,
    };
  }
}
