import { Injectable } from "@nestjs/common";
import jwtDecode from "jwt-decode";
import { UserInfo } from "../../types";

@Injectable()
export class AuthService {
  parseAuthorizationHeader(token: string): UserInfo {
    return jwtDecode(token) as UserInfo;
  }
}
