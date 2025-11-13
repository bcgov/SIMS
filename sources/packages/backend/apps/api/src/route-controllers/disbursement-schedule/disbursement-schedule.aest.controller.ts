import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import {
  ApiNotFoundResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { ApiProcessError, ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import { CancelDisbursementScheduleAPIInDTO } from "../../route-controllers";
import { DisbursementScheduleService } from "../../services";
import { CustomNamedError } from "@sims/utilities";
import {
  DISBURSEMENT_SCHEDULE_INVALID_STATE_TO_BE_UPDATED,
  DISBURSEMENT_SCHEDULE_NOT_FOUND,
  DISBURSEMENT_SCHEDULE_NOT_UPDATED,
  INVALID_OPERATION_IN_THE_CURRENT_STATUS,
} from "@sims/services/constants";
import { DisbursementScheduleStatus } from "@sims/sims-db";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("disbursement-schedule")
@ApiTags(`${ClientTypeBaseRoute.AEST}-disbursement-schedule`)
export class DisbursementScheduleAESTController extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
  ) {
    super();
  }

  /**
   * Cancels a disbursement schedule.
   * @param disbursementScheduleId disbursement schedule ID.
   * @param payload payload with the cancellation info.
   */
  @ApiNotFoundResponse({ description: "Disbursement schedule not found." })
  @ApiUnprocessableEntityResponse({
    description:
      `Disbursement schedule expected to be '${DisbursementScheduleStatus.Sent}' to allow it to be rejected or ` +
      "disbursement schedule has receipts associated with it and cannot be rejected.",
  })
  @Roles(Role.StudentCancelDisbursementSchedule)
  @Patch(":disbursementScheduleId/cancel")
  async cancelDisbursementSchedule(
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @Body() payload: CancelDisbursementScheduleAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    try {
      await this.disbursementScheduleService.rejectDisbursement(
        disbursementScheduleId,
        payload.note,
        userToken.userId,
      );
    } catch (error: unknown) {
      if (error instanceof CustomNamedError) {
        switch (error.name) {
          case DISBURSEMENT_SCHEDULE_NOT_FOUND:
            throw new NotFoundException(error.message);
          case DISBURSEMENT_SCHEDULE_NOT_UPDATED:
          case DISBURSEMENT_SCHEDULE_INVALID_STATE_TO_BE_UPDATED:
          case INVALID_OPERATION_IN_THE_CURRENT_STATUS:
            throw new UnprocessableEntityException(
              new ApiProcessError(error.message, error.name),
            );
        }
      }
      throw error;
    }
  }
}
