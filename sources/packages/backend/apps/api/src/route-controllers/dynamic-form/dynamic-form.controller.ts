import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { FormService } from "../../services";
import {
  AllowAuthorizedParty,
  RequiresUserAccount,
} from "../../auth/decorators";
import { AuthorizedParties } from "../../auth";
import { ApiTags } from "@nestjs/swagger";
import { FormPathParamAPIInDTO } from "./models/form.dto";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@RequiresUserAccount(false)
@Controller("dynamic-form")
@ApiTags("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  /**
   * Get a form definition from Form.io.
   * @param formPath path of the form to be retrieved.
   * @returns form definition.
   */
  @Get(":formPath")
  async getForm(@Param() formPathParam: FormPathParamAPIInDTO): Promise<any> {
    return this.formService.fetch(formPathParam.formPath);
  }
}
