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
        this.addAuthHeader()
      );
      if(response.status===200) {        
        let user = response.data as User;
        if(user.id){ userExists = true}  
         
      } else if (response.status===404) {
        userExists = false;
      }
      return userExists;

    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }


  public async synchronizeUserInfo(): Promise<void>{
    try {
      console.log('About to call Sync User Info Web API')
      const response = await this.apiClient.patch(
        "users/sync-user",
        this.addAuthHeader()
      );
      console.log(`After call Sync User Info Web API..`)
      console.dir(response.data) ; 
            
    } catch (error) {
      this.handleRequestError(error);
      throw error;
    }
  }

}  
