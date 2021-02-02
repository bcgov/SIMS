import ApiClient from "./http/ApiClient";
import User from "./http/common/User"

export class UserService {
  // Share Instance
  private static instance?: UserService;

  /**
    * The Singleton’s constructor should always be private to prevent direct
    * construction calls with the new operator.
    */
  private UserService(){}

  public static get shared(): UserService {
    return this.instance || (this.instance = new this());
  }

  async checkUser(): Promise<User> {
   const user =  await ApiClient.User.checkUser();
   return user;
  }

  
}
