import axios from "axios";
import { stringify } from "querystring";

export enum ClientId {
  Institution = "institution",
  Student = "student",
  Aest = "aest",
  SupportingUsers = "supportingUsers",
}

export default class Authorization {
  async getAuthToken(
    username: string,
    password: string,
    clientId: string,
    authUrl: string
  ): Promise<string> {
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
    const response = await axios.post(authUrl, body, settings);
    return response.data.access_token;
  }
}
