import HttpBaseClient from "./common/HttpBaseClient";

export default interface User {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  userName: string;
}

export class UserApi extends HttpBaseClient {
  public async checkUser(): Promise<boolean> {
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        this.addAuthHeader(),
      );
      return response.data as boolean;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
