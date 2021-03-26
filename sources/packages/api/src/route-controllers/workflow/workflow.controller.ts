import { Body, Controller, Param, Post } from "@nestjs/common";
import BaseController from "../BaseController";
import { RuleEngineService } from "../../services";

@Controller("workflow")
export class WorkflowController extends BaseController {
  constructor(private readonly engine: RuleEngineService) {
    super();
  }

  @Post("start/:workflowName")
  async start(
    @Param("workflowName") workflowName: string,
    @Body() payload: any,
  ): Promise<any> {
    return (await this.engine.start(workflowName, payload)).data;
  }
}
