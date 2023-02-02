import { HttpStatus, INestApplication } from "@nestjs/common";
import * as request from "supertest";
import { AESTGroups, BEARER_AUTH_TYPE, getAESTToken } from "./token-helpers";

export interface ExpectedPermissions {
  aestGroup: AESTGroups;
  expectedHttpStatus: HttpStatus;
}

export async function assertGroupAccess(
  app: INestApplication,
  endpoint: string,
  ...permissions: ExpectedPermissions[]
) {
  for (const permission of permissions) {
    await request(app.getHttpServer())
      .post(endpoint)
      .auth(await getAESTToken(permission.aestGroup), BEARER_AUTH_TYPE)
      .expect(permission.expectedHttpStatus);
  }
}
