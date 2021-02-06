import ApiClient from "./http/ApiClient";

export default interface User {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  userName: string;
}

export class UserService {
  // Share Instance
  private static instance: UserService;

  /**
   * The Singleton’s constructor should always be private to prevent direct
   * construction calls with the new operator.
   */
  //TODO : this throws a compile error
  //private UserService(){}

  public static get shared(): UserService {
    return this.instance || (this.instance = new this());
  }

  async checkUser(): Promise<boolean> {
    return await ApiClient.User.checkUser();
  }

  /**
   * Client method to call inorder to update the user information.
   */
  async synchronizeUserInfo(): Promise<void> {
    return await ApiClient.User.synchronizeUserInfo();
  }
}
