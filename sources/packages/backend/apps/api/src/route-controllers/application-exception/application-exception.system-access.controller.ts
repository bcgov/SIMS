import { Body, Controller, Post } from "@nestjs/common";
import { ApplicationExceptionService } from "../../services";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute } from "../../types";
import { ApiBadRequestResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { CreateApplicationExceptionAPIInDTO } from "./models/application-exception.dto";
import { IUserToken } from "../../auth/userToken.interface";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";

@AllowAuthorizedParty(AuthorizedParties.formsFlowBPM)
@Controller("application-exception")
@ApiTags(`${ClientTypeBaseRoute.SystemAccess}-application-exception`)
export class ApplicationExceptionSystemAccessController extends BaseController {
  constructor(
    private readonly applicationExceptionService: ApplicationExceptionService,
  ) {
    super();
  }

  /**
   * Creates student application exceptions to be assessed by the Ministry.
   * Exceptions are detected during full-time/part-time application submissions
   * and are usually related to documents uploaded that must be reviewed.
   * @param payload information to create the exception.
   * @returns newly created application exception id.
   */
  @Post()
  @ApiBadRequestResponse({
    description: "Student application exception names must be unique.",
  })
  async createException(
    @UserToken() userToken: IUserToken,
    @Body() payload: CreateApplicationExceptionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const exceptionNames = payload.exceptionRequests.map(
      (exceptionRequest) => exceptionRequest.exceptionName,
    );

    const createdException =
      await this.applicationExceptionService.createException(
        payload.applicationId,
        exceptionNames,
        userToken.userId,
      );
    return { id: createdException.id };
  }
}
