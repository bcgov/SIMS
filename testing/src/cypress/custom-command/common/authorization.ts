import axios, { AxiosResponse } from "axios";
import { stringify } from "querystring";
import authData from "../../e2e/data/authentication-details.json";

export default class Authorization {
  async getAuthToken(): Promise<AxiosResponse<String>> {
    const auth_url = authData.testEnv.keyCloakTokenUrl;
    const body = stringify({
      username: authData.testEnv.username,
      password: authData.testEnv.password,
      grant_type: "password",
      client_id: "institution",
    });
    const settings = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    try {
      const response = await axios.post(auth_url, body, settings);
      return response.data["access_token"];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
