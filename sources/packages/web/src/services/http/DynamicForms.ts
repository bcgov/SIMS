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

  public async getDraft(formName: string): Promise<any> {
    try {
      return await this.apiClient.get(
        `dynamic-form/${formName}/draft`,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async saveDraft(formName: string, data: any) {
    try {
      return await this.apiClient.post(
        `dynamic-form/${formName}/draft`,
        data,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async deleteDraft(formName: string) {
    try {
      return await this.apiClient.delete(
        `dynamic-form/${formName}/draft`,
        this.addAuthHeader(),
      );
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
