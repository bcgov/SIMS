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
import { ApplicationExceptionService } from "../../services";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  ApplicationExceptionAPIOutDTO,
  UpdateApplicationExceptionAPIInDTO,
} from "./models/application-exception.dto";
import { IUserToken } from "src/auth/userToken.interface";
import { CustomNamedError } from "src/utilities";
import {
  STUDENT_APPLICATION_EXCEPTION_INVALID_STATE,
  STUDENT_APPLICATION_EXCEPTION_NOT_FOUND,
} from "../../constants";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("application-exception")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-application-exception`)
export class ApplicationExceptionAESTController extends BaseController {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {
    super();
  }

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
      exceptionRequests: applicationException.exceptionRequests.map(
        (request) => ({
          exceptionName: request.exceptionName,
        }),
      ),
    };
  }

  @Patch(":exceptionId")
  @ApiNotFoundResponse({
    description: "Student application exception not found.",
  })
  async approveException(
    @Param("exceptionId", ParseIntPipe) exceptionId: number,
    @Body() payload: UpdateApplicationExceptionAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.applicationExceptionService.approveException(
        exceptionId,
        payload.exceptionStatus,
        payload.noteDescription,
        userToken.userId,
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
