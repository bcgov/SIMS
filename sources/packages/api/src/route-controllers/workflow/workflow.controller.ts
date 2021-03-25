import { Body, Controller, Param, Post } from "@nestjs/common";
import BaseController from "../BaseController";
import axios from "axios";

@Controller("workflow")
export class WorkflowController extends BaseController {
  constructor() {
    super();
  }

  @Post("start/:workflowName")
  async start(
    @Param("workflowName") workflowName: string,
    @Body() payload: any,
  ): Promise<any> {
    console.log(payload);
    const workflowUrl = `http://localhost:8181/engine-rest/process-definition/key/${workflowName}/start`;
    const response = await axios.post(workflowUrl, payload);
    return response.data;
  }
}
