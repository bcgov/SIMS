import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Post,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApplicationService } from "../../services";
import BaseController from "../BaseController";
import { ApplicationBaseAPIOutDTO } from "./models/application.dto";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { UserGroups } from "../../auth/user-groups.enum";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import { ClientTypeBaseRoute } from "../../types";
import { ApplicationControllerService } from "./application.controller.service";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { MSFAANumberSharedService } from "@sims/services";
import { CustomNamedError } from "@sims/utilities";
import {
  APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR,
  APPLICATION_NOT_FOUND,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { IUserToken } from "../../auth";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("application")
@ApiTags(`${ClientTypeBaseRoute.AEST}-application`)
export class ApplicationAESTController extends BaseController {
  constructor(
    private readonly applicationService: ApplicationService,
    private readonly applicationControllerService: ApplicationControllerService,
    private readonly msfaaNumberSharedService: MSFAANumberSharedService,
  ) {
    super();
  }

  /**
   * API to fetch application details by applicationId.
   * This API will be used by ministry users.
   * @param applicationId
   * @returns Application details
   */
  @Get(":applicationId")
  @ApiNotFoundResponse({ description: "Application not found." })
  async getApplication(
    @Param("applicationId", ParseIntPipe) applicationId: number,
  ): Promise<ApplicationBaseAPIOutDTO> {
    const application = await this.applicationService.getApplicationById(
      applicationId,
      { loadDynamicData: true },
    );
    if (!application) {
      throw new NotFoundException(
        `Application id ${applicationId} was not found.`,
      );
    }

    application.data =
      await this.applicationControllerService.generateApplicationFormData(
        application.data,
      );
    return this.applicationControllerService.transformToApplicationForAESTDTO(
      application,
    );
  }

  /**
   * Creates a new MSFAA number to be associated with the student, cancelling any
   * pending MSFAA for the particular offering intensity and also associating the
   * new MSFAA number to any pending disbursement for the same offering intensity.
   * @param applicationId reference application id.
   * @returns the newly created MSFAA.
   */
  @Post(":applicationId/reissue-msfaa")
  @ApiNotFoundResponse({ description: "Application id not found." })
  @ApiUnprocessableEntityResponse({
    description:
      "Not possible to reissue an MSFAA when there is no pending disbursements for the application, or " +
      "not possible to reissue an MSFAA when the current associated MSFAA is not cancelled.",
  })
  async reissueMSFAA(
    @Param("applicationId", ParseIntPipe) applicationId: number,
    @UserToken() userToken: IUserToken,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    try {
      const newMSFAANumber = await this.msfaaNumberSharedService.reissueMSFAA(
        applicationId,
        userToken.userId,
      );
      return { id: newMSFAANumber.id };
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case APPLICATION_NOT_FOUND:
            throw new NotFoundException(error.message);
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
          case APPLICATION_INVALID_DATA_TO_CREATE_MSFAA_ERROR:
            throw new UnprocessableEntityException(error.message);
        }
      }
      throw error;
    }
  }
}
