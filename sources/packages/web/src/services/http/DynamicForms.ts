import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  public async getFormDefinition(formName: string): Promise<any> {
    return this.getCall(`dynamic-form/${formName}`);
  }

  public async getFormlist(): Promise<any> {
    return this.getCall(`dynamic-form`);
  }
}
