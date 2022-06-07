import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApplicationExceptionService,
  WorkflowActionsService,
} from "../../services";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "./models/application-exception.dto";
import { IUserToken } from "../../auth/userToken.interface";
import { CustomNamedError } from "../../utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";
import { UserGroups } from "../../auth/user-groups.enum";
import { ApplicationExceptionStatus } from "../../database/entities";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application-exception")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application-exception`)
export class ApplicationExceptionAESTController extends BaseController {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
    private readonly workflowActionsService: WorkflowActionsService,
  ) {
    super();
  }

  /**
   * Get a student application expectation detected after the student application was
   * submitted, for instance, when there are documents to be reviewed.
   * @param exceptionId exception to be retrieved.
   * @returns student application expectation information.
   */
  @Get(":exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  async getExceptionById(
    @Param("exceptionId", ParseIntPipe) exceptionId: number,
  ): Promise<ApplicationExceptionAPIOutDTO> {
    const applicationException =
      await this.applicationExceptionService.getExceptionById(exceptionId);
    if (!applicationException) {
      throw new NotFoundException("Student application exception not found.");
    }
    return {
      exceptionStatus: applicationException.exceptionStatus,
      noteDescription: applicationException.exceptionNote.description,
      exceptionRequests: applicationException.exceptionRequests.map(
        (request) => ({
          exceptionName: request.exceptionName,
        }),
      ),
    };
  }

  /**
   * Updates the student application exception approving or denying it.
   * @param exceptionId exception to be approved or denied.
   * @param payload information to approve or deny the exception.
   */
  @Patch(":exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  @ApiUnprocessableEntityResponse({
    description: `Student application exception must be in ${ApplicationExceptionStatus.Pending} state to be assessed.`,
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
          payload.exceptionStatus,
          payload.noteDescription,
          userToken.userId,
        );
      await this.workflowActionsService.sendApplicationExceptionApproval(
        updatedException.id,
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
}
