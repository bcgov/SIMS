import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import axios from "axios";
import { FormService } from "../../services";

@Controller("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor(private readonly formService: FormService) {
    super();
  }

  @Get(":formName")
  async getForm(@Param("formName") formName: string): Promise<any> {
    return this.formService.fetch(formName);
  }
}
