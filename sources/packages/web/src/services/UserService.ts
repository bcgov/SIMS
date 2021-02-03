import ApiClient from "./http/ApiClient";
// import User from "./http/common/User"

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
   const user =  await ApiClient.User.checkUser();
   console.log('In UserService')
   console.dir(user);
    if(user.id){
      return true
    }
    return false;
  }

  
}
