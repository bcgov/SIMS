import axios from "axios";
import { stringify } from "querystring";

export default class Authorization {
  CLIENT_ID = {
    INSTITUTION: "institution",
    STUDENT: "student",
  };
  async getAuthToken(
    username: string,
    password: string,
    clientId: string,
    authUrl: string
  ): Promise<string> {
    const auth_url = authUrl;
    const body = stringify({
      grant_type: "password",
      username: username,
      password: password,
      client_id: clientId,
    });
    const settings = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    };
    try {
      const response = await axios.post(auth_url, body, settings);
      return response.data.access_token;
    } catch (error) {
      throw error;
    }
  }
}
