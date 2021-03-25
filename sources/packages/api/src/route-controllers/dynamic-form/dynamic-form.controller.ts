import { Controller, Get, Param } from "@nestjs/common";
import BaseController from "../BaseController";
import axios from "axios";

@Controller("dynamic-form")
export class DynamicFormController extends BaseController {
  constructor() {
    super();
  }

  @Get(":formName")
  async getForm(@Param("formName") formName: string): Promise<any> {
    const formUrl = `http://localhost:3001/${formName}`;
    const content = await axios.get(formUrl);
    return content.data;
  }
}
