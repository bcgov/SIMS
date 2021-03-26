import HttpBaseClient from "./common/HttpBaseClient";

export class DynamicFormsApi extends HttpBaseClient {
  public async getFormDefinition(formName: string): Promise<any> {
    try {
      return await this.apiClient.get(
        `dynamic-form/${formName}`,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async getFormlist(): Promise<any> {
    try {
      return await this.apiClient.get(`dynamic-form`, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
