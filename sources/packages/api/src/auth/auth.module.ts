import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import {
  KeycloakConnectModule,
  ResourceGuard,
  RoleGuard,
  AuthGuard,
} from 'nest-keycloak-connect';

import { AuthService } from './auth.service';

@Module({
  imports: [
    KeycloakConnectModule.register({
      authServerUrl: process.env.KEYCLOAK_AUTH_URL,
      realm: process.env.KEYCLOAK_REALM,
      clientId: process.env.KEYCLOAK_CLIENT_API,
      secret: process.env.KEYCLOAK_CLIENT_SECRET,
    }),
  ],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    /*{
      provide: APP_GUARD,
      useClass: ResourceGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RoleGuard,
    },*/
  ],
})
export class AuthModule {}
