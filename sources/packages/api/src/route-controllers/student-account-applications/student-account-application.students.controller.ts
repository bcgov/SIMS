import { Body, Controller, Injectable, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IUserToken } from "../../auth/userToken.interface";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import {
  AllowAuthorizedParty,
  RequiresStudentAccount,
  UserToken,
} from "../../auth/decorators";
import BaseController from "../BaseController";
import { ClientTypeBaseRoute } from "../../types";
import { PrimaryIdentifierAPIOutDTO } from "../models/primary.identifier.dto";
import { CreateStudentAccountApplicationAPIInDTO } from "./models/student-account-application.dto";

/**
 * Student account applications when the authentication happens through BCeID
 * and the Ministry needs to confirm the student identity.
 */
@AllowAuthorizedParty(AuthorizedParties.student)
@RequiresStudentAccount()
@Controller("student-account-application")
@ApiTags(`${ClientTypeBaseRoute.Student}-student-account-application`)
@Injectable()
export class StudentAccountApplicationStudentsController extends BaseController {
  constructor() {
    super();
  }

  @Post()
  @RequiresStudentAccount(false)
  async create(
    @UserToken() studentUserToken: IUserToken,
    @Body() payload: CreateStudentAccountApplicationAPIInDTO,
  ): Promise<PrimaryIdentifierAPIOutDTO> {
    console.log(studentUserToken);
    console.log(payload);
    return { id: 1 };
  }
}
