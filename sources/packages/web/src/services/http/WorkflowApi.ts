import HttpBaseClient from "./common/HttpBaseClient";

export class WorkflowApi extends HttpBaseClient {
  public async startWorkflow(workflowName: string, payload: any): Promise<any> {
    try {
      return await this.apiClient.post(
        `workflow/start/${workflowName}`,
        payload,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
