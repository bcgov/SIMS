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
    let userExists = false;
    try {
      const response = await this.apiClient.get(
        "users/check-user",
        this.addAuthHeader(),
      );
      if (response.status === 200) {
        const user = response.data as User;
        //TODO: This should not ideally rely on id.
        if (user.id) {
          userExists = true;
        }
      }
      return userExists;
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

  public async synchronizeUserInfo(): Promise<void> {
    try {
      /**
       * TODO Dont quite agree with sending a null in a patch/put request but going with it for now
       */
      await this.apiClient.patch("users/sync-user", null, this.addAuthHeader());
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }
}
