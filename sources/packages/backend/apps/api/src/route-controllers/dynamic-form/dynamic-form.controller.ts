import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { FormService } from "../../services";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";
import { ApiTags } from "@nestjs/swagger";
import { FormNameParamAPIInDTO } from "./models/form.dto";

@AllowAuthorizedParty(
  AuthorizedParties.institution,
  AuthorizedParties.student,
  AuthorizedParties.supportingUsers,
  AuthorizedParties.aest,
)
@Controller("dynamic-form")
@ApiTags("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  @Get()
  async list(): Promise<any> {
    return this.formService.list();
  }
  @Get(":formName")
  async getForm(@Param() formNameParam: FormNameParamAPIInDTO): Promise<any> {
    return this.formService.fetch(formNameParam.formName);
  }
}
