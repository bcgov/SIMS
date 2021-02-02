import HttpBaseClient from "./common/HttpBaseClient";
import User from "./common/User"

export class UserApi  extends HttpBaseClient{
    public async checkUser(): Promise<User> {
        try {
          const response = await this.apiClient.get("user-info/check-user", this.addAuthHeader());
          return response.data;
        } catch (error) {
          this.handleRequestError(error);
          throw error;
        }
      }
}