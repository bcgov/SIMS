import { AuthService } from "../AuthService";
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

  /**
   * Get full url and authorization bearer token.
   * @returns a list with full url as first element
   * and  authorization bearer token as second element.
   */
  public formIOUrlAndBearerToken(): string[] {
    const uri = "dynamic-form";
    const token = AuthService.shared.keycloak?.token;
    const authorization = `Bearer ${token}`;
    return [`${this.apiClient.defaults.baseURL}/${uri}`, authorization];
  }
}
