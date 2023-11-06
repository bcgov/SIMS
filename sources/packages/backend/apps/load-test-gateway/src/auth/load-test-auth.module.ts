import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { LoadTestJwtStrategy } from "./load-test-jwt-strategy";
import { ConfigModule } from "@sims/utilities/config";
import { KeycloakService } from "@sims/auth/services";
import { KeycloakConfig } from "@sims/auth/config";
import { HttpModule } from "@nestjs/axios";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { APP_GUARD } from "@nestjs/core";

const jwtModule = JwtModule.register({
  publicKey: KeycloakConfig.PEM_PublicKey,
});

@Module({
  imports: [HttpModule, ConfigModule, PassportModule, jwtModule],
  providers: [
    KeycloakService,
    LoadTestJwtStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [jwtModule, KeycloakService, HttpModule],
})
export class LoadTestAuthModule {}
