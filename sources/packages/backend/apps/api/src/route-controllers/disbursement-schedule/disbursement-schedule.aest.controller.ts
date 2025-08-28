import {
  Body,
  Controller,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ApiNotFoundResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import {
  AllowAuthorizedParty,
  Groups,
  Roles,
  UserToken,
} from "../../auth/decorators";
import { ClientTypeBaseRoute } from "../../types";
import { AuthorizedParties, IUserToken, Role, UserGroups } from "../../auth";
import { DisbursementScheduleSharedService } from "@sims/services";
import { DisbursementScheduleService } from "../../services";
import { DisbursementScheduleStatus } from "@sims/sims-db";
import { CancelDisbursementScheduleAPIInDTO } from "../../route-controllers";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("disbursement-schedule")
@ApiTags(`${ClientTypeBaseRoute.AEST}-disbursement-schedule`)
export class DisbursementScheduleAESTController extends BaseController {
  constructor(
    private readonly disbursementScheduleService: DisbursementScheduleService,
    private readonly disbursementScheduleSharedService: DisbursementScheduleSharedService,
  ) {
    super();
  }

  /**
   * Cancels a disbursement schedule.
   * @param disbursementScheduleId disbursement schedule ID.
   * @param payload payload with the cancellation info.
   */
  @ApiNotFoundResponse({
    description: "To be added",
  })
  @Roles(Role.StudentCancelDisbursementSchedule)
  @Patch(":disbursementScheduleId/cancel")
  async cancelDisbursementSchedule(
    @Param("disbursementScheduleId", ParseIntPipe)
    disbursementScheduleId: number,
    @Body() payload: CancelDisbursementScheduleAPIInDTO,
    @UserToken() userToken: IUserToken,
  ): Promise<void> {
    const disbursement =
      await this.disbursementScheduleService.getDisbursementById(
        disbursementScheduleId,
      );
    if (!disbursement) {
      throw new NotFoundException("Disbursement schedule not found.");
    }
    if (
      disbursement.disbursementScheduleStatus !==
      DisbursementScheduleStatus.Sent
    ) {
      throw new UnprocessableEntityException(
        "Disbursement schedule is expected to be sent to allow its cancellation.",
      );
    }
    if (disbursement.disbursementReceipts?.length) {
      throw new UnprocessableEntityException(
        "Disbursement receipts were already received for this disbursement schedule.",
      );
    }
    try {
      await this.disbursementScheduleSharedService.rejectDisbursement(
        disbursementScheduleId,
        userToken.userId,
        true,
      );
    } catch (error: unknown) {
      // TODO: to be added.
    }
  }
}
