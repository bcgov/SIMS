import { Body, Controller, Param, Post } from "@nestjs/common";
import BaseController from "../BaseController";
import { WorkflowService } from "../../services";

@Controller("workflow")
export class WorkflowController extends BaseController {
  constructor(private readonly engine: WorkflowService) {
    super();
  }

  @Post("start/:workflowName")
  async start(
    @Param("workflowName") workflowName: string,
    @Body() payload: any,
  ): Promise<any> {
    return this.engine.start(workflowName, payload);
  }
}
