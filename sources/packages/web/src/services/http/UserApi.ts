import HttpBaseClient from "./common/HttpBaseClient";
//import User from "./common/User"


export default interface User {
  email: string;
  firstName: string;
  id: number;
  lastName: string;
  userName: string;
}

export class UserApi  extends HttpBaseClient{
    public async checkUser(): Promise<User> {
        try {
          const response = await this.apiClient.get("users/check-user", this.addAuthHeader());
          console.log('after call');
          console.dir(response);
          return response.data as User;
        } catch (error) {
          this.handleRequestError(error);
          throw error;
        }
      }
}