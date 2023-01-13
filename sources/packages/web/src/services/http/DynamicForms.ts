import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  public async getFormDefinition(formName: string): Promise<any> {
    try {
      return this.getCall(`dynamic-form/${formName}`, this.addAuthHeader());
    } catch (error: unknown) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getFormlist(): Promise<any> {
    return this.getCall(`dynamic-form`, this.addAuthHeader());
  }
}
