import { Body, Controller, Post } from "@nestjs/common";
import { ApplicationExceptionService } from "../../services";
import { AllowAuthorizedParty, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ClientTypeBaseRoute, IConfig } from "../../types";
import { ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { CreateApplicationExceptionAPIInDTO } from "./models/application.system-access.dto";
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
   * Creates student application exceptions to be reviewed by the Ministry.
   * @param payload information to create the exception.
   * @returns newly created application exception id.
   */
  @Post()
  async createException(
    @UserToken() userToken: IUserToken,
    @Body() payload: CreateApplicationExceptionAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    const createdException =
      await this.applicationExceptionService.createException(
        payload.applicationId,
        payload.exceptionRequests.map(
          (exceptionRequest) => exceptionRequest.exceptionName,
        ),
        userToken.userId,
      );
    return { id: createdException.id };
  }
}
