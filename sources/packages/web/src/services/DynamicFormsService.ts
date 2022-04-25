import ApiClient from "./http/ApiClient";

export class DynamicFormsService {
  // Share Instance
  private static instance: DynamicFormsService;

  public static get shared(): DynamicFormsService {
    return this.instance || (this.instance = new this());
  }

  /**
   * Get full url and authorization bearer token.
   * @returns a list with full url as first element
   * and  authorization bearer token as second element.
   */
  formIOUrlAndBearerToken(): string[] {
    return ApiClient.DynamicFormsApi.formIOUrlAndBearerToken();
  }
}
