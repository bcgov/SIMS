import {
  Controller,
  Param,
  Body,
  NotFoundException,
  UnprocessableEntityException,
  BadRequestException,
  InternalServerErrorException,
  Get,
  Type,
} from "@nestjs/common";
import {
  ApplicationService,
  FormService,
  StudentAppealService,
} from "../../services";
import { StudentAppealDTO } from "./models/student-appeal.dto";
import { PrimaryIdentifierDTO } from "../models/primary.identifier.dto";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { AllowAuthorizedParty, Groups, UserToken } from "../../auth/decorators";
import { IUserToken } from "../../auth/userToken.interface";
import { ApiProduces, ApiResponse, ApiTags } from "@nestjs/swagger";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute, ApiProcessError } from "../../types";
import { INVALID_APPLICATION_NUMBER } from "../../constants";
import { UserGroups } from "src/auth/user-groups.enum";

@AllowAuthorizedParty(AuthorizedParties.aest)
@Groups(UserGroups.AESTUser)
@Controller("appeal")
@ApiTags(`${ClientTypeBaseRoute.AEST}-appeal`)
export class StudentAppealAESTController extends BaseController {
  constructor(
    private readonly studentAppealService: StudentAppealService,
    private readonly applicationService: ApplicationService,
    private readonly formService: FormService,
  ) {
    super();
  }

  @Get(":appealId/requests")
  async getStudentAppeal(@Param("appealId") appealId: number): Promise<any> {
    const studentAppeal =
      await this.studentAppealService.getAppealAndRequestsById(appealId);
    return studentAppeal;
  }
}
