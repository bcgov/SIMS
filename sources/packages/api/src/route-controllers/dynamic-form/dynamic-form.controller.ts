import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import { FormService } from "../../services";
import { AllowAuthorizedParty } from "../../auth/decorators";
import { AuthorizedParties } from "../../auth/authorized-parties.enum";

@AllowAuthorizedParty(AuthorizedParties.institution, AuthorizedParties.student)
@Controller("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  @Get()
  async list(): Promise<any> {
    return this.formService.list();
  }
  @Get(":formName")
  async getForm(@Param("formName") formName: string): Promise<any> {
    return this.formService.fetch(formName);
  }
}
